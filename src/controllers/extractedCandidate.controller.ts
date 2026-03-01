import { Request, Response } from "express";
import { ExtractedCandidateModel } from "../models/extractedCandidate.model";

export const getExtractedCandidateById = async (req: Request, res: Response) => {
  const candidateId = req.params.candidateId;

  try {
    const extracted = await ExtractedCandidateModel.findOne({ candidateId });

    if (!extracted) {
      return res.status(404).json({
        success: false,
        message: "Extracted candidate not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: extracted,
    });
  } catch (error: any) {
    console.error("Error fetching extracted candidate:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Error fetching extracted candidate",
    });
  }
};
