// src/api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "https://melolo-api-one.vercel.app", // backend FastAPI
  timeout: 15000,
});
