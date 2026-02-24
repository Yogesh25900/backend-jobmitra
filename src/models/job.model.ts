    import mongoose, { Schema, Document, Types } from "mongoose";
    import { JobType } from "../types/job.type";

    export interface JobDocument extends Omit<JobType, 'employerId' | 'jobCategory'>, Document {
      skills: any;
      employerId: Types.ObjectId | string;
      jobCategory?: Types.ObjectId | string;
}

    const JobSchemaMongoose = new Schema<JobDocument>(
    {
        jobTitle: String,
        companyName: String,
        jobLocation: String,
        jobType: String,
        experienceLevel: String,
        jobCategory: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: false,
        },
        jobDescription: String,
        applicationDeadline: String,

        responsibilities: [String],
        qualifications: [String],
        tags: [String],

        companyProfilePicPath: { type: String, default: "" },
        status: { type: String, default: "Active" },

        employerId: {
        type: Schema.Types.ObjectId,
        ref: "EmployerUser",
        required: true,
        },
    },
    { timestamps: true }    
    );

    export const JobModel =
    mongoose.models.Job || mongoose.model<JobDocument>("Job", JobSchemaMongoose);
