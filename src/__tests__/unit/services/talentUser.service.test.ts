import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { TalentUserRepository } from "../../../repositories/talentUser.repository";
import { TalentUserService } from "../../../services/talentUser.service";
import { MailService } from "../../../services/mail/mail.service";
import { getMailTemplate } from "../../../services/mail/mail.templates";
import { notifyAdminOnNewTalent } from "../../../services/notification.service";
import { MOCK_IDS } from "../../__mocks__/ids";

jest.mock("bcryptjs", () => ({
    __esModule: true,
    default: {
        hash: jest.fn(),
        compare: jest.fn(),
    },
}));

jest.mock("jsonwebtoken", () => ({
    __esModule: true,
    default: {
        sign: jest.fn(),
    },
}));

jest.mock("../../../services/mail/mail.service", () => ({
    MailService: {
        sendMail: jest.fn(),
    },
}));

jest.mock("../../../services/mail/mail.templates", () => ({
    getMailTemplate: jest.fn(),
}));

jest.mock("../../../services/notification.service", () => ({
    notifyAdminOnNewTalent: jest.fn(),
}));

describe("TalentUserService Unit Test", () => {
    let service: TalentUserService;

    const baseTalent = {
        _id: MOCK_IDS.talentUserId,
        fname: "Test",
        lname: "Talent",
        email: "talent@example.com",
        password: "hashed-password",
        role: "candidate",
    } as any;

    beforeEach(() => {
        service = new TalentUserService();
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should register talent successfully and notify admin", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(null);
        (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-password");
        jest.spyOn(TalentUserRepository.prototype, "createTalent").mockResolvedValue(baseTalent);
        (notifyAdminOnNewTalent as jest.Mock).mockResolvedValue(null);

        const result = await service.registerTalent({
            fname: "Test",
            lname: "Talent",
            email: "talent@example.com",
            password: "plain-password",
            confirmPassword: "plain-password",
            phoneNumber: "9800000000",
        });

        expect(result).toBe(baseTalent);
        expect(TalentUserRepository.prototype.createTalent).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "talent@example.com",
                password: "hashed-password",
            })
        );
        expect(TalentUserRepository.prototype.createTalent).toHaveBeenCalledWith(
            expect.not.objectContaining({ confirmPassword: expect.anything() })
        );
        expect(notifyAdminOnNewTalent).toHaveBeenCalledWith(baseTalent._id.toString());
    });

    it("should throw 409 when registering with existing email", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);

        await expect(
            service.registerTalent({
                fname: "Test",
                lname: "Talent",
                email: "talent@example.com",
                password: "plain-password",
                confirmPassword: "plain-password",
                phoneNumber: "9800000000",
            })
        ).rejects.toMatchObject({ statusCode: 409, message: "Email already in use" });
    });

    it("should login talent successfully", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);
        (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue("signed-token");

        const result = await service.loginTalent({
            email: "talent@example.com",
            password: "plain-password",
        });

        expect(result.token).toBe("signed-token");
        expect(result.talent).toBe(baseTalent);
        expect(jwt.sign).toHaveBeenCalled();
    });

    it("should throw 401 when login password is invalid", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);
        (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

        await expect(
            service.loginTalent({ email: "talent@example.com", password: "wrong-password" })
        ).rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
    });

    it("should throw 404 when getTalentById cannot find user", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentById").mockResolvedValue(null);

        await expect(service.getTalentById(MOCK_IDS.talentUserId)).rejects.toMatchObject({
            statusCode: 404,
            message: "Talent user not found",
        });
    });

    it("should update talent and hash password when provided", async () => {
        (bcryptjs.hash as jest.Mock).mockResolvedValue("new-hashed-password");
        jest.spyOn(TalentUserRepository.prototype, "updateTalent").mockResolvedValue({
            ...baseTalent,
            password: "new-hashed-password",
            fname: "Updated",
        } as any);

        const result = await service.updateTalent(MOCK_IDS.talentUserId, {
            password: "new-password",
            confirmPassword: "new-password",
            fname: "Updated",
        } as any);

        expect(result.fname).toBe("Updated");
        expect(TalentUserRepository.prototype.updateTalent).toHaveBeenCalledWith(
            MOCK_IDS.talentUserId,
            expect.objectContaining({ password: "new-hashed-password" })
        );
    });

    it("should throw 404 when updateTalent target does not exist", async () => {
        jest.spyOn(TalentUserRepository.prototype, "updateTalent").mockResolvedValue(null);

        await expect(service.updateTalent(MOCK_IDS.talentUserId, { fname: "Updated" } as any)).rejects.toMatchObject({
            statusCode: 404,
            message: "Talent user not found",
        });
    });

    it("should send password reset OTP", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);
        (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-otp");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);

        const result = await service.sendPasswordResetOtp({ email: "talent@example.com" });

        expect(result).toEqual({ message: "OTP sent to your email" });
        expect(getMailTemplate).toHaveBeenCalled();
        expect(MailService.sendMail).toHaveBeenCalledWith({
            to: "talent@example.com",
            subject: "OTP",
            html: "<p>otp</p>",
        });
    });

    it("should verify OTP successfully after OTP request", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);
        (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-otp");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);

        await service.sendPasswordResetOtp({ email: "talent@example.com" });

        (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

        const result = await service.verifyOTP({ email: "talent@example.com", otp: "123456" });

        expect(result).toEqual({
            message: "OTP verified successfully",
            email: "talent@example.com",
        });
    });

    it("should reset password successfully when OTP exists", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);
        (bcryptjs.hash as jest.Mock)
            .mockResolvedValueOnce("hashed-otp")
            .mockResolvedValueOnce("hashed-new-password");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(TalentUserRepository.prototype, "updateTalent").mockResolvedValue(baseTalent);

        await service.sendPasswordResetOtp({ email: "talent@example.com" });
        const result = await service.resetPassword({
            email: "talent@example.com",
            newPassword: "new-password",
            confirmPassword: "new-password",
        });

        expect(result).toEqual({ message: "Password reset successfully" });
        expect(TalentUserRepository.prototype.updateTalent).toHaveBeenCalledWith(
            baseTalent._id.toString(),
            expect.objectContaining({ password: "hashed-new-password" })
        );
    });

    it("should throw 400 when reset password called without OTP verification flow", async () => {
        jest.spyOn(TalentUserRepository.prototype, "getTalentByEmail").mockResolvedValue(baseTalent);

        await expect(
            service.resetPassword({
                email: "talent@example.com",
                newPassword: "new-password",
                confirmPassword: "new-password",
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "OTP verification required. Please verify OTP first.",
        });
    });
});
