export default {
  type: "object",
  properties: {
    line_items: { type: 'array' , items: { 
      type: 'object' ,
      properties: {
        properties : {type: 'array', items: {
          type:'object',
          properties : {
            name: {type :'string'},
            value: {type : 'string'} 
          }
        }}
      }}}
  },
  required: ['name']
} as const;
