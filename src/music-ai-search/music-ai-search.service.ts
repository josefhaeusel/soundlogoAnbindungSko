import { Injectable } from '@nestjs/common'

@Injectable()
export class MusicAiSearchService {
  async freeTextSearch(prompt) {
    const auth_token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiSW50ZWdyYXRpb25BY2Nlc3NUb2tlbiIsInZlcnNpb24iOiIxLjAiLCJpbnRlZ3JhdGlvbklkIjo5NTcsInVzZXJJZCI6NjcyNjcsImFjY2Vzc1Rva2VuU2VjcmV0IjoiMTMyZDE2ZjZlYzRhNWVlNWFmODE5Zjg3MDljY2YwYzQ2Y2U3MDVhZmQxMjkwYThiMWQ5YWU2YjY0ODcwNGJhYiIsImlhdCI6MTcwODUzMjQyNn0.L1lqo8DNFFtGVkiHUSkBBchWGojIIRAJ8pRIEx4SUnc'

    return fetch('https://api.cyanite.ai/graphql', {
      method: 'POST',
      body: JSON.stringify({
        query: /* GraphQL */ `
          query FreeTextSearchExample($text: String!) {
            freeTextSearch(
              first: 3
              target: { crate: { crateId: "972" } }
              searchText: $text
            ) {
              ... on FreeTextSearchError {
                message
                code
              }
              ... on FreeTextSearchConnection {
                edges {
                  cursor
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        `,
        variables: {
          text: prompt,
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + auth_token,
      },
    }).then((res) => {
      return res.json()
    })
  }
}
