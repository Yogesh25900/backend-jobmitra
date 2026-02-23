import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { EmployerUserRepository } from "../../../repositories/employerUser.repository";
import { EmployerUserService } from "../../../services/employerUser.service";
import { MailService } from "../../../services/mail/mail.service";
import { getMailTemplate } from "../../../services/mail/mail.templates";
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

describe("EmployerUserService Unit Test", () => {
    let service: EmployerUserService;

    const baseEmployer = {
        _id: MOCK_IDS.employerUserId,
        companyName: "Acme Corp",
        email: "hr@example.com",
        password: "hashed-password",
        role: "employer",
    } as any;

    beforeEach(() => {
        service = new EmployerUserService();
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should register employer successfully", async () => {
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue(null);
        (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-password");
        jest.spyOn(EmployerUserRepository.prototype, "createEmployer").mockResolvedValue(baseEmployer);

        const result = await service.registerEmployer({
            companyName: "Acme Corp",
            email: "hr@example.com",
            password: "plain-password",
            confirmPassword: "plain-password",
            phoneNumber: "9800000000",
            contactName: "HR",
        });

        expect(result).toBe(baseEmployer);
        expect(EmployerUserRepository.prototype.createEmployer).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "hr@example.com",
                password: "hashed-password",
            })
        );
        expect(EmployerUserRepository.prototype.createEmployer).toHaveBeenCalledWith(
            expect.not.objectContaining({ confirmPassword: expect.anything() })
        );
    });

    it("should throw 409 when registering with existing email", async () => {
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue(baseEmployer);

        await expect(
            service.registerEmployer({
                companyName: "Acme Corp",
                email: "hr@example.com",
                password: "plain-password",
                confirmPassword: "plain-password",
                phoneNumber: "9800000000",
                contactName: "HR",
            })
        ).rejects.toMatchObject({ statusCode: 409, message: "Email already in use" });
    });

    it("should login employer successfully", async () => {
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue(baseEmployer);
        (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
        (jwt.sign as jest.Mock).mockReturnValue("signed-token");

        const result = await service.loginEmployer({
            email: "hr@example.com",
            password: "plain-password",
        });

        expect(result.token).toBe("signed-token");
        expect(result.employer).toBe(baseEmployer);
        expect(jwt.sign).toHaveBeenCalled();
    });

    it("should throw 401 when login password is invalid", async () => {
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue(baseEmployer);
        (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

        await expect(
            service.loginEmployer({ email: "hr@example.com", password: "wrong-password" })
        ).rejects.toMatchObject({ statusCode: 401, message: "Invalid credentials" });
    });

    it("should throw 404 when getEmployerById cannot find user", async () => {
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerById").mockResolvedValue(null);

        await expect(service.getEmployerById(MOCK_IDS.employerUserId)).rejects.toMatchObject({
            statusCode: 404,
            message: "Employer not found",
        });
    });

    it("should update employer and hash password when provided", async () => {
        (bcryptjs.hash as jest.Mock).mockResolvedValue("new-hashed-password");
        jest.spyOn(EmployerUserRepository.prototype, "updateEmployer").mockResolvedValue({
            ...baseEmployer,
            password: "new-hashed-password",
            companyName: "Updated Corp",
        } as any);

        const result = await service.updateEmployer(MOCK_IDS.employerUserId, {
            companyName: "Updated Corp",
            password: "new-password",
            confirmPassword: "new-password",
        } as any);

        expect(result.companyName).toBe("Updated Corp");
        expect(EmployerUserRepository.prototype.updateEmployer).toHaveBeenCalledWith(
            MOCK_IDS.employerUserId,
            expect.objectContaining({ password: "new-hashed-password" })
        );
    });

    it("should throw 404 when updateEmployer target does not exist", async () => {
        jest.spyOn(EmployerUserRepository.prototype, "updateEmployer").mockResolvedValue(null);

        await expect(
            service.updateEmployer(MOCK_IDS.employerUserId, { companyName: "Updated" } as any)
        ).rejects.toMatchObject({
            statusCode: 404,
            message: "Employer not found",
        });
    });

    it("should send password reset OTP", async () => {
        const email = "otp-send@example.com";
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue({
            ...baseEmployer,
            email,
        } as any);
        (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-otp");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);

        const result = await service.sendPasswordResetOtp({ email });

        expect(result).toEqual({ message: "OTP sent to your email", email });
        expect(getMailTemplate).toHaveBeenCalled();
        expect(MailService.sendMail).toHaveBeenCalledWith({
            to: email,
            subject: "OTP",
            html: "<p>otp</p>",
        });
    });

    it("should verify OTP successfully after OTP request", async () => {
        const email = "otp-verify@example.com";
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue({
            ...baseEmployer,
            email,
        } as any);
        (bcryptjs.hash as jest.Mock).mockResolvedValue("hashed-otp");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);

        await service.sendPasswordResetOtp({ email });
        (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

        const result = await service.verifyOTP({ email, otp: "123456" });

        expect(result).toEqual({
            message: "OTP verified successfully",
            email,
        });
    });

    it("should reset password successfully when OTP exists", async () => {
        const email = "otp-reset@example.com";
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue({
            ...baseEmployer,
            email,
        } as any);
        (bcryptjs.hash as jest.Mock)
            .mockResolvedValueOnce("hashed-otp")
            .mockResolvedValueOnce("hashed-new-password");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);
        jest.spyOn(EmployerUserRepository.prototype, "updateEmployer").mockResolvedValue(baseEmployer);

        await service.sendPasswordResetOtp({ email });
        const result = await service.resetPassword({
            email,
            newPassword: "new-password",
            confirmPassword: "new-password",
        });

        expect(result).toEqual({ message: "Password reset successfully" });
        expect(EmployerUserRepository.prototype.updateEmployer).toHaveBeenCalledWith(
            baseEmployer._id.toString(),
            expect.objectContaining({ password: "hashed-new-password" })
        );
    });

    it("should throw 400 when reset password called without OTP verification flow", async () => {
        const email = "missing-otp@example.com";
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue({
            ...baseEmployer,
            email,
        } as any);

        await expect(
            service.resetPassword({
                email,
                newPassword: "new-password",
                confirmPassword: "new-password",
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            message: "OTP verification required. Please verify OTP first.",
        });
    });

    it("should verify OTP and reset password in one step", async () => {
        const email = "otp-combined@example.com";
        jest.spyOn(EmployerUserRepository.prototype, "getEmployerByEmail").mockResolvedValue({
            ...baseEmployer,
            email,
        } as any);
        (bcryptjs.hash as jest.Mock)
            .mockResolvedValueOnce("hashed-otp")
            .mockResolvedValueOnce("hashed-new-password");
        (getMailTemplate as jest.Mock).mockReturnValue({ subject: "OTP", html: "<p>otp</p>" });
        (MailService.sendMail as jest.Mock).mockResolvedValue(undefined);
        (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
        jest.spyOn(EmployerUserRepository.prototype, "updateEmployer").mockResolvedValue(baseEmployer);

        await service.sendPasswordResetOtp({ email });

        const result = await service.verifyOtpAndResetPassword({
            email,
            otp: "123456",
            newPassword: "new-password",
            confirmPassword: "new-password",
        });

        expect(result).toEqual({ message: "Password reset successfully" });
        expect(EmployerUserRepository.prototype.updateEmployer).toHaveBeenCalledWith(
            baseEmployer._id.toString(),
            expect.objectContaining({ password: "hashed-new-password" })
        );
    });
});
