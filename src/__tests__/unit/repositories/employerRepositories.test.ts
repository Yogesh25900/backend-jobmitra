import mongoose from "mongoose";
import { EmployerUserRepository } from "../../../repositories/employerUser.repository";
import { EmployerUserModel } from "../../../models/employerUser.model";

describe("Employer Repository Unit Test", () => {
    let employerRepository: EmployerUserRepository;
    let createdEmployerIds: string[] = []; // Track test records

    const createEmployerPayload = (suffix: string) => ({
        companyName: "Acme Corp",
        email: `hr.${suffix}@example.com`,
        password: "password123",
        role: "employer" as const,
    });

    beforeAll(() => {
        employerRepository = new EmployerUserRepository();
    });

    afterEach(async () => {
        // Only delete records created by this test suite
        if (createdEmployerIds.length > 0) {
            await EmployerUserModel.deleteMany({ 
                _id: { $in: createdEmployerIds.map(id => new mongoose.Types.ObjectId(id)) } 
            });
            createdEmployerIds = [];
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("should create an employer user", async () => {
        const payload = createEmployerPayload("create");

        const result = await employerRepository.createEmployer(payload);

        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.email).toBe(payload.email);
        expect(result.companyName).toBe(payload.companyName);
        createdEmployerIds.push(result._id.toString());
    });

    it("should get an employer user by email", async () => {
        const payload = createEmployerPayload("by-email");
        const created = await employerRepository.createEmployer(payload);
        createdEmployerIds.push(created._id.toString());

        const result = await employerRepository.getEmployerByEmail(payload.email);

        expect(result).not.toBeNull();
        expect(result?.email).toBe(payload.email);
    });

    it("should return null when getting employer by non-existent email", async () => {
        const result = await employerRepository.getEmployerByEmail("missing@example.com");

        expect(result).toBeNull();
    });

    it("should get an employer user by id", async () => {
        const created = await employerRepository.createEmployer(createEmployerPayload("by-id"));
        createdEmployerIds.push(created._id.toString());

        const result = await employerRepository.getEmployerById(created._id.toString());

        expect(result).not.toBeNull();
        expect(result?._id.toString()).toBe(created._id.toString());
    });

    it("should get all employers", async () => {
        const e1 = await employerRepository.createEmployer(createEmployerPayload("all-1"));
        const e2 = await employerRepository.createEmployer(createEmployerPayload("all-2"));
        createdEmployerIds.push(e1._id.toString(), e2._id.toString());

        // Get all employers and filter to only those created by this test
        const allEmployers = await employerRepository.getAllEmployers();
        const testEmployers = allEmployers.filter(e => createdEmployerIds.includes(e._id.toString()));

        expect(testEmployers.length).toBe(2);
        expect(testEmployers.map((employer) => employer.email)).toEqual(
            expect.arrayContaining(["hr.all-1@example.com", "hr.all-2@example.com"])
        );
    });

    it("should update an employer user", async () => {
        const created = await employerRepository.createEmployer(createEmployerPayload("update"));
        createdEmployerIds.push(created._id.toString());

        const result = await employerRepository.updateEmployer(created._id.toString(), {
            companyName: "Updated Company",
            location: "Kathmandu",
        });

        expect(result).not.toBeNull();
        expect(result?.companyName).toBe("Updated Company");
        expect(result?.location).toBe("Kathmandu");
        expect(result?.email).toBe("hr.update@example.com");
    });

    it("should return null when updating non-existent employer", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        const result = await employerRepository.updateEmployer(nonExistentId, { companyName: "NoUser" });

        expect(result).toBeNull();
    });

    it("should delete an employer user", async () => {
        const created = await employerRepository.createEmployer(createEmployerPayload("delete"));
        // Note: Not tracking this ID since it's intentionally deleted in the test

        const deleted = await employerRepository.deleteEmployer(created._id.toString());
        const fetched = await employerRepository.getEmployerById(created._id.toString());

        expect(deleted).toBe(true);
        expect(fetched).toBeNull();
    });

    it("should return false when deleting non-existent employer", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        const deleted = await employerRepository.deleteEmployer(nonExistentId);

        expect(deleted).toBe(false);
    });
});
