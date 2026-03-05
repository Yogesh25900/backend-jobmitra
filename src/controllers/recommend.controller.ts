import { Request, Response } from "express";
import { recommendJobs } from "../services/python.service";

export const recommendJobsForCandidate = async (req: Request, res: Response) => {
  const candidateId = req.params.candidateId;
  const topN = req.query.top_n ? parseInt(req.query.top_n as string, 10) : 10;
  const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : undefined;

  try {
    const matches = await recommendJobs(candidateId, topN, threshold);
    return res.status(200).json(matches);
  } catch (error: any) {
    console.error("Error fetching recommendations:", error?.message || error);
    return res.status(500).json({ message: "Error fetching recommendations" });
  }
};
