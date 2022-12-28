import Head from 'next/head'
import Image from 'next/image'
import { Inter } from '@next/font/google'
import styles from '../styles/Home.module.css'
import React, { useEffect } from 'react'
import { quizSubjects } from '../common/subjects'
import { Language, languages_list } from '../common/languages'
import LanguageCombo from '../components/LanguageCombo'
import { ArrowPathIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Question } from './api/questions'

function classNames(...classes: (string | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}

export interface QuizForm {
  email: string
  password: string
  subject: string
  amountOfQuestions: number
  language: Language
}

export default function Home() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [language, setLanguage] = React.useState<Language>(languages_list.find(l => l.code === 'en')!)
  const [amountOfQuestions, setAmountOfQuestions] = React.useState(10);
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const [randomQuizSubject, setRandomQuizSubject] = React.useState<string | undefined>(undefined);

  useEffect(() => {
    setRandomQuizSubject(quizSubjects[Math.floor(Math.random() * quizSubjects.length)]);
  }, []);

  return (
    <>
      <Head>
        <title>QuizGPT</title>
        <meta name="description" content="Generate Kahoot quizes using ChatGPT" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        
        <h1 className='font-extrabold text-transparent text-6xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600'>QuizGPT</h1>
        <p className='mb-4'>Create Kahoot quizes in no time</p>

        <div className='grid gap-y-2'>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              OpenAI Email
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="email"
                id="email"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoComplete="off"
                placeholder='you@example.com'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              OpenAI Password
            </label>
            <div className="mt-1">
              <input
                type="password"
                name="password"
                id="password"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoComplete="off"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Subject
            </label>
            <div className="mt-1">
              <input
                type="text"
                name="subject"
                id="subject"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoComplete="off"
                placeholder={randomQuizSubject}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="amountOfQuestions" className="block text-sm font-medium text-gray-700">
              Amount of questions
            </label>
            <div className="mt-1">
              <input
                type="number"
                name="amountOfQuestions"
                id="amountOfQuestions"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                autoComplete="off"
                value={amountOfQuestions}
                onChange={e => setAmountOfQuestions(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <LanguageCombo
            selectedLanguage={language}
            setSelectedLanguage={setLanguage}
          />

          {!!email && !!password && !!subject && !!amountOfQuestions && !!language && <button
            type="button"
            className={classNames(
              !isLoading ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" : "bg-gray-500",
              "mt-4 justify-center inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm"
            )}
            disabled={isLoading}
            onClick={() => {
              console.log('Generating questions...')
              setIsLoading(true)
              fetch('/api/questions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({email, password, subject, amountOfQuestions, language})
              })
                .then(response => response.json())
                .then(data => {
                  console.log(data)
                  setQuestions(data)
                })
                .finally(() => setIsLoading(false))
            }}
          >
            {!isLoading && "Generate questions"}
            {isLoading && "Generating questions..."}
            {!isLoading && <SparklesIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
            {isLoading && <ArrowPathIcon className="animate-spin ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
          </button>}

        </div>

      </main>
    </>
  )
}
