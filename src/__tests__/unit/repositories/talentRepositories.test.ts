import mongoose from "mongoose";
import { TalentUserRepository } from "../../../repositories/talentUser.repository";
import { TalentUserModel } from "../../../models/talentUser_model";

describe("Talent Repository Unit Test", () => {
    let talentRepository: TalentUserRepository;
    let createdTalentIds: string[] = []; // Track test records

    const createTalentPayload = (suffix: string) => ({
        fname: "John",
        lname: "Doe",
        email: `john.${suffix}@example.com`,
        password: "password123",
        role: "candidate" as const,
    });

    beforeAll(() => {
        talentRepository = new TalentUserRepository();
    });

    afterEach(async () => {
        // Only delete records created by this test suite
        if (createdTalentIds.length > 0) {
            await TalentUserModel.deleteMany({ 
                _id: { $in: createdTalentIds.map(id => new mongoose.Types.ObjectId(id)) } 
            });
            createdTalentIds = [];
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    it("should create a talent user", async () => {
        const payload = createTalentPayload("create");

        const result = await talentRepository.createTalent(payload);

        expect(result).toBeDefined();
        expect(result._id).toBeDefined();
        expect(result.email).toBe(payload.email);
        expect(result.fname).toBe(payload.fname);
        createdTalentIds.push(result._id.toString());
    });

    it("should get a talent user by email", async () => {
        const payload = createTalentPayload("by-email");
        const created = await talentRepository.createTalent(payload);
        createdTalentIds.push(created._id.toString());

        const result = await talentRepository.getTalentByEmail(payload.email);

        expect(result).not.toBeNull();
        expect(result?.email).toBe(payload.email);
    });

    it("should return null when getting talent by non-existent email", async () => {
        const result = await talentRepository.getTalentByEmail("missing@example.com");

        expect(result).toBeNull();
    });

    it("should get a talent user by id", async () => {
        const created = await talentRepository.createTalent(createTalentPayload("by-id"));
        createdTalentIds.push(created._id.toString());

        const result = await talentRepository.getTalentById(created._id.toString());

        expect(result).not.toBeNull();
        expect(result?._id.toString()).toBe(created._id.toString());
    });

    it("should get a user by id using getUserById", async () => {
        const created = await talentRepository.createTalent(createTalentPayload("user-by-id"));
        createdTalentIds.push(created._id.toString());

        const result = await talentRepository.getUserById(created._id.toString());

        expect(result).not.toBeNull();
        expect(result?._id.toString()).toBe(created._id.toString());
    });

    it("should get all talents", async () => {
        const t1 = await talentRepository.createTalent(createTalentPayload("all-1"));
        const t2 = await talentRepository.createTalent(createTalentPayload("all-2"));
        createdTalentIds.push(t1._id.toString(), t2._id.toString());

        // Get all talents and filter to only those created by this test
        const allTalents = await talentRepository.getAllTalents();
        const testTalents = allTalents.filter(t => createdTalentIds.includes(t._id.toString()));

        expect(testTalents.length).toBe(2);
        expect(testTalents.map((talent) => talent.email)).toEqual(
            expect.arrayContaining(["john.all-1@example.com", "john.all-2@example.com"])
        );
    });

    it("should update a talent user", async () => {
        const created = await talentRepository.createTalent(createTalentPayload("update"));
        createdTalentIds.push(created._id.toString());

        const result = await talentRepository.updateTalent(created._id.toString(), {
            fname: "UpdatedName",
            title: "Software Engineer",
        });

        expect(result).not.toBeNull();
        expect(result?.fname).toBe("UpdatedName");
        expect(result?.title).toBe("Software Engineer");
        expect(result?.email).toBe("john.update@example.com");
    });

    it("should return null when updating non-existent talent", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        const result = await talentRepository.updateTalent(nonExistentId, { fname: "NoUser" });

        expect(result).toBeNull();
    });

    it("should delete a talent user", async () => {
        const created = await talentRepository.createTalent(createTalentPayload("delete"));
        createdTalentIds.push(created._id.toString());

        const deleted = await talentRepository.deleteTalent(created._id.toString());
        const fetched = await talentRepository.getTalentById(created._id.toString());

        expect(deleted).toBe(true);
        expect(fetched).toBeNull();
    });

    it("should return false when deleting non-existent talent", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        const deleted = await talentRepository.deleteTalent(nonExistentId);

        expect(deleted).toBe(false);
    });



});