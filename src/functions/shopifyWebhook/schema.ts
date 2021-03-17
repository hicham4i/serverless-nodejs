export default {
  type: "object",
  properties: {
    line_items: {
      type: 'array', items: {
        type: 'object',
        properties: {
          quantity : {type :'number'},
          properties: {
            type: 'array', items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                value: {
                  anyOf: [
                    { type: 'string' },
                    {
                      type: 'array', items: {
                        type: 'number'
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  }
} as const;
