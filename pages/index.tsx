import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '../styles/Home.module.css'
import React, { useEffect } from 'react'
import { quizSubjects } from '../common/subjects'
import { Language, languages_list } from '../common/languages'
import LanguageCombo from '../components/LanguageCombo'
import { ArrowDownTrayIcon, ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, SparklesIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { QueryQuestionsResponse, Question, ResultType } from './api/questions'
import { read, utils, writeFile } from 'xlsx';
import TimeLimitSelect from '../components/TimeLimitSelect'

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

export interface QuizForm {
  subject: string
  amountOfQuestions: number
  language: Language
}

export default function Home() {
  const [subject, setSubject] = React.useState("");
  const [language, setLanguage] = React.useState<Language>(languages_list.find(l => l.code === 'en')!)
  const [amountOfQuestions, setAmountOfQuestions] = React.useState<number | null | undefined>(10);
  const [timeLimit, setTimeLimit] = React.useState<number>(30);
  const [queryResponse, setQueryResponse] = React.useState<QueryQuestionsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const [randomQuizSubject, setRandomQuizSubject] = React.useState<string | undefined>(undefined);

  const [errorText, setErrorText] = React.useState<string>("");

  useEffect(() => {
    setRandomQuizSubject(quizSubjects[Math.floor(Math.random() * quizSubjects.length)]);
  }, []);

  

  return (
    <>
      <Head>
        <title>QuizGPT</title>
        <meta name="description" content="Generate Kahoot quizzes using ChatGPT" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        
        <h1 className='font-extrabold text-transparent text-6xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600'>QuizGPT</h1>
        <p className='mb-4'>Create Kahoot quizzes in no time</p>

        <div className='grid gap-y-2'>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-500">
              Subject
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="subject"
                id="subject"
                className="text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoComplete="off"
                placeholder={randomQuizSubject}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="amountOfQuestions" className="block text-sm font-medium text-gray-500">
              Amount of questions
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="amountOfQuestions"
                id="amountOfQuestions"
                className="text-black block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoComplete="off"
                value={amountOfQuestions || ''}
                onChange={e => setAmountOfQuestions(parseInt(e.target.value))}
              />
            </div>
          </div>

          <TimeLimitSelect
            selectedTimeLimit={timeLimit}
            setSelectedTimeLimit={setTimeLimit}
          />
          
          <LanguageCombo
            selectedLanguage={language}
            setSelectedLanguage={setLanguage}
          />

          {!!subject && !!amountOfQuestions && !!language && 
          <>
            <button
              type="button"
              className={classNames(
                !isLoading ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" : "bg-gray-500",
                "mt-4 justify-center inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm"
              )}
              disabled={isLoading}
              onClick={() => {
                console.log('Generating questions...')
                setIsLoading(true)
                setErrorText('')
                fetch('/api/questions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({subject, amountOfQuestions, language})
                })
                  .then(response => response.json())
                  .then((data: QueryQuestionsResponse) => {
                    console.log(data)
                    const questionsWithoutAnswers = data.questions.filter(q => q.answers.length === 0)
                    const questionsWithoutCorrectAnswer = data.questions.filter(q => q.correctAnswerPositions.length === 0)
                    if (questionsWithoutAnswers.length > 0 || questionsWithoutCorrectAnswer.length > 0) { 
                      setErrorText(`Question generation failed. Try again with a tweaked prompt.`)
                      setQueryResponse(null)
                    }
                    else {
                      setQueryResponse(data)
                    }
                    
                  })
                  .finally(() => setIsLoading(false))
              }}
            >
              {!isLoading && "Generate questions"}
              {isLoading && "Generating questions..."}
              {!isLoading && <SparklesIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
              {isLoading && <ArrowPathIcon className="animate-spin ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
            </button>
            {/* Error text */}
            {!!errorText && 
            <div className='flex flex-row items-center'>
              <ExclamationCircleIcon className="flex-none animate-pulse mr-1 h-5 w-5 text-red-500" aria-hidden="true" />
              <p className='text-sm text-red-500'>{errorText}</p>
            </div>
            }
          </>
          }
        </div>

        {!!queryResponse && !isLoading &&
        <>
          <hr className='my-4 w-full max-w-xs h-px bg-gray-200 border-0 dark:bg-gray-400'/>

          <button
            type="button"
            className={classNames(
              !isExporting ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" : "bg-gray-500",
              "justify-center inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm"
            )}
            disabled={isExporting}
            onClick={() => {
              console.log('Exporting questions...')
              setIsExporting(true)
              const f = fetch("/KahootQuizTemplate.xlsx")
                .then((res) => {
                  return res.arrayBuffer()
                })
                .then((ab) => {
                  const wb = read(ab, { type: "buffer" });
                  console.log(wb.SheetNames)
                  console.log(wb.Sheets[wb.SheetNames[0]])
                  let questionList = []
                  for (const question of queryResponse.questions) {
                    // Only add C, D, E and F if the question has that many answers
                    questionList.push({
                      B: question.question,
                      C: question.answers.at(0),
                      D: question.answers.at(1),
                      E: question.answers.at(2),
                      F: question.answers.at(3),
                      G: timeLimit,
                      H: question.correctAnswerPositions.map(x => x + 1).join(',')
                    })
                  }
                  utils.sheet_add_json(wb.Sheets[wb.SheetNames[0]], questionList, {origin: "B9", skipHeader: true})
                  writeFile(wb, `KahootQuizTemplate_${subject.substring(0, 10)}_${amountOfQuestions}-questions-${language.name.split(" - ")[0]}.xlsx`)
                })
                .finally(() => setIsExporting(false))
              
              
            }}
          >
            {!isExporting && "Export questions"}
            {isExporting && "Exporting questions..."}
            {!isExporting && <ArrowDownTrayIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
            {isExporting && <ArrowPathIcon className="animate-spin ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
          </button>

          <div className='mt-4 w-full max-w-xs flex flex-row items-center'>
            <InformationCircleIcon className="flex-none animate-pulse mr-1 h-5 w-5 text-gray-500" aria-hidden="true" />
            <span>
              <p className='text-sm text-gray-500'>{"Upload this quiz to Kahoot by clicking 'Add\u00A0question' and 'Import\u00A0spreadsheet' at"}</p>
              <a className='text-sm text-gray-500' href='https://create.kahoot.it/creator' target="_blank" rel="noopener noreferrer">https://create.kahoot.it/creator</a>
            </span>
          </div>

          <div className='mt-4 w-full max-w-xs flex flex-row items-center'>
            <InformationCircleIcon className="flex-none animate-pulse mr-1 h-5 w-5 text-orange-600" aria-hidden="true" />
            <span>
              <p className='text-sm text-orange-600'>{"Remember that ChatGPT is incorrect very often! Please double check the answers. Also, ChatGPT does not know anything about what has happened after September 2021."}</p>
            </span>
          </div>

          <div className='mt-1 w-full max-w-xs'>
            {queryResponse.questions.map((question, questionIndex) => (
              <div key={question.question} className='mt-4 p-4 bg-slate-200 rounded-md border border-indigo-400'>
                <h2 className='text-black font-bold text-sm'>{questionIndex+1}. {question.question}</h2>
                <ul className='grid grid-cols-1 gap-2 mt-2'>
                  {question.answers.map((answer, answerIndex) => {
                    return <li key={answer} className='p-2 bg-slate-100 rounded-md flex flex-row items-center'>
                      {question.correctAnswerPositions.includes(answerIndex) && <CheckCircleIcon className="flex-none mr-2 -ml-1 h-5 w-5 text-green-500" aria-hidden="true" />}
                      {!question.correctAnswerPositions.includes(answerIndex) && <XCircleIcon className="flex-none mr-2 -ml-1 h-5 w-5 text-red-500" aria-hidden="true" />}
                      <span className='text-black'>{answer} </span>
                    </li>
                  })}
                </ul>
                
              </div>
            )
            )}
          </div>
          
        </>
        }

        <div className='mt-10 mb-4 grid grid-cols-1 justify-items-center'>
          {/* Copyright Sigfrid Stjärnholm 2022, link to Github */}
          <p className='text-sm text-gray-500'>© {new Date().getFullYear()} Sigfrid Stjärnholm</p>
          <a className='text-sm text-gray-500' href='https://github.com/Kladdy' target="_blank" rel="noopener noreferrer">github.com/Kladdy</a>
        </div>

      </main>
    </>
  )
}
