import axios from "axios";

export const api = axios.create({
    baseURL: "https://nutria-generativegemini.onrender.com" 
});