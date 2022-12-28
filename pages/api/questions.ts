// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import { ChatGPTAPIBrowser } from 'chatgpt'
import { QuizForm } from '..';

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


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QueryQuestionsResponse>
) {
  const form: QuizForm = req.body

  const api = new ChatGPTAPIBrowser({
    email: form.email,
    password: form.password
  })

  console.log("Logging in...")
  await api.initSession()

  console.log("Sending message...")
  const message = `
    I want to make a quiz about ${form.subject}.
    I want ${form.amountOfQuestions} questions, with 4 answers per question.
    The questions should be in ${form.language.name.split(" - ")[0]}.
    Please give me 1-3 correct answers for each question, and the other answers should be incorrect.
    The question can not be longer than 120 characters, and the answers can not be longer than 75 characters.
    Format: Question|Answer1|Answer2|Answer3|Answer4
    A # mark indicates the correct answer(s).
    Example: What is the capital of France?|Paris#|London|Berlin|Madrid
    Example: What are some colors?|Fruit|Blue#|Green#|Planet
    Before each question, please write the question number with a $ sign in front.
  `
  const result = await api.sendMessage(message)

  console.log("Parsing result...")
  const questions: Question[] = []
  for (const line of result.response.split("\n")) {
    if (line.startsWith("$")) {
      const line_split = line.split("|")
      const question = line_split[0].split(". ")[1] // Remove the question number
      const answers = line_split.slice(1)
      const correctAnswerPositions = answers.map((a, i) => a.endsWith("#") ? i : -1).filter(i => i !== -1)
      questions.push({
        question,
        answers: answers.map(a => a.replace("#", "")),
        correctAnswerPositions
      })
    }
  }

  res.status(200).json({questions: questions, requestMessage: message, responseMessage: result.response})
}