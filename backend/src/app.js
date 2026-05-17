import express from 'express';
import cors from 'cors'; 


const app = express();
app.use(express.json());

//By default, browsers block requests from one domain (origin) to another. 
//In my project it's needed to allow calls between domains. For example, my frontend runs on localhost:5173 and my backend on localhost:4000, so the frontend can't make API calls to the backend without CORS enabled.
app.use(cors());

export default app;