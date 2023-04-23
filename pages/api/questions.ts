// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

const { Configuration, OpenAIApi } = require("openai");
import { QuizForm } from '..';
import { archive } from '../../common/archive';

export interface Question {
  question: string;
  answers: string[];
  correctAnswerPositions: number[];
}

export interface QueryQuestionsResponse {
  questions: Question[]
  requestMessage: string;
  responseMessage: string;
}

export interface ResultType {
  questions: Question[], 
  requestMessage: string, 
  responseMessage: string
}



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QueryQuestionsResponse | any>
) {
  const form: QuizForm = req.body

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({error: "API not configured"})
    return
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  

  console.log("Logging in...")
  const openai = new OpenAIApi(configuration);

  console.log("Sending message...")
  const message = `I want to make a quiz about ${form.subject}.
I want ${form.amountOfQuestions} questions, with 4 answers per question.
The questions should be in ${form.language.name.split(" - ")[0]}.
Please give me 1 correct answer for each question.
The question can not be longer than 120 characters, and the answers can not be longer than 75 characters.
Format: Question|Answer1|Answer2|Answer3|Answer4
A # mark indicates the correct answer.
Each question and its answers should be on a single line.
Before each question, please write the question number with a $ sign in front.
Example response: 
"$1. What is the capital of France?|Paris#|London|Berlin|Madrid
$2. How many letters are in the english alphabet?|30|24|28|26#"`
  console.log(message)


  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{role: "user", content: message}],
  });

  // console.log(completion.data);
  const result = completion.data.choices[0].message.content as string
  console.log("Got response:")
  console.log(result)

  console.log("Parsing result...")
  const questions: Question[] = []
  for (const line of result.split("\n")) {
    if (line.startsWith("$") || line.match(/^\d/)) { // If line starts with a $ or a number 
      const line_split = line.split("|")
      let [first, ...rest] = line_split[0].split(". ")
      const question = rest.join(". ").trim() // Remove the question number
      const answers = line_split.slice(1).map(x => x.trim())
      const correctAnswerPositions = answers.map((a, i) => a.includes("#") ? i : -1).filter(i => i !== -1)

      // Shuffle the answers around and adjust the correct answer positions accordingly
      for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
        correctAnswerPositions.forEach((p, k) => {  
          if (p === i) correctAnswerPositions[k] = j
          else if (p === j) correctAnswerPositions[k] = i
        })
      }

      questions.push({
        question,
        answers: answers.map(a => a.replace("#", "")),
        correctAnswerPositions
      })
    }
  }
  const r : ResultType = {questions: questions, requestMessage: message, responseMessage: result}
  console.log(r)

  // Send result to archive api
  archive(r)

  res.status(200).json(r)
}