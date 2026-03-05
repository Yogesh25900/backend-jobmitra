import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { PYTHON_API } from "../config";

export const sendToPython = async (params: { cvFilePath: string; candidateId: string }) => {
  const { cvFilePath, candidateId } = params;

  try {
    const form = new FormData();
    const fileBuffer = fs.readFileSync(cvFilePath);

    form.append("file", fileBuffer, {
      filename: "cv.pdf",
      contentType: "application/pdf",
    });

    form.append("candidateId", String(candidateId));

    const response = await axios.post(`${PYTHON_API}/process_cv`, form, {
      headers: {
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error: any) {
    console.error("Python API error:", error?.message || error);
    return null;
  }
};

export const recommendJobs = async (candidateId: string, topN?: number, threshold?: number) => {
  try {
    const response = await axios.get(`${PYTHON_API}/recommend/${candidateId}`, {
      params: {
        top_n: topN,
        threshold,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Python recommend error:", error?.message || error);
    return [];
  }
};
