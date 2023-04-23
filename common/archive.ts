// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { ResultType } from '../pages/api/questions';


export function archive(resultType: ResultType) {
  let ioKey = "quizgpt-dev"
  // Check if we are in production
  if (process.env.NODE_ENV === 'production') {
    ioKey = "quizgpt-prod"
  }

  fetch(`https://io.stjarnholm.com/api/statistics/save_object?key=${ioKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resultType),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Archive success:', data);
    })
    .catch((error) => {
      console.error('Archive error:', error);
    });
}
