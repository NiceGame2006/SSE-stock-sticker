## Spec

- package tool: npm

- Client: Angular

  - package:
    - rxjs
  - how-to-start:
    - in command-line => type:
      - ng serve
    - client port = 4200

- Server: Nodejs

  - package:

    - express
    - fs
    - csv-parser
    - nodemon
    - ts-node
    - typescript and @types/express

  - how-to-start:

    - in 'package.json' => add:

      - "scripts": {

          "dev": "nodemon app.ts"

         }

    - in command-line => type:
      
      - npm run dev
      
    - server-port = 3000
    
      - to restart server => just save the file again => nodemon will auto restart the server

- Client-Server Communication:
  - Server-Sent-Events (SSE)
  - a client browsing the client-side url will trigger app.get() and add him to the clients array
  - if the clients array isn't empty => means there are still clients connecting
    - the server should continously stream events to the clients
  - updates in webgrid arrives in batch per second => according to the Time column in csv
    - eg. if 1st entry time is T=0, 2nd entry time is T=5
    - the program will wait for 5seconds to display the 2nd entry data
  - anychanges in the 'data.csv' should immediately reflect changes

