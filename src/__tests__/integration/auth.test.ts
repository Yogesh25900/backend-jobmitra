import { TalentUserModel } from "../../models/talentUser_model";
import request from 'supertest';
import app from '../../app';
import { AdminUserModel } from "../../models/AdminUser.model";

describe('Authentication Integration Tests', () => {
    const talentTestUser = {
        email: 'talent.test@example.com',
        password: 'talentpassword123',
        fname: 'Talent User Fname',
        lname: 'Talent User Lname',
        confirmPassword: 'talentpassword123'
    };

    const adminTestUser = {
        email: 'admin.test@example.com',
        password: 'adminpassword123',
        confirmPassword: 'adminpassword123',
    };

    beforeAll(async () => {
        await AdminUserModel.deleteMany({ email: adminTestUser.email });
        await TalentUserModel.deleteMany({ email: talentTestUser.email });
    });

    afterAll(async () => {
        await AdminUserModel.deleteMany({ email: adminTestUser.email });
        await TalentUserModel.deleteMany({ email: talentTestUser.email });
    });

    describe('Talent User Registration Tests', () => {
        it('should register a new talent user', async () => {
            const response = await request(app)
                .post('/api/talentusers/register')
                .send({
                    email: talentTestUser.email,
                    password: talentTestUser.password,
                    fname: talentTestUser.fname,
                    lname: talentTestUser.lname,
                    confirmPassword: talentTestUser.confirmPassword
                });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Talent registered successfully');
        });

  
    });

    describe("Employer User Registration Tests", () => {
        it("should register a new employer user", async () => {
            const response = await request(app)
                .post('/api/employerusers/register')
                .send({
           
                    companyName: "Test Company",
                    contactName: "Test Contact",
                    email: "employer.test@example.com",
                    password: "employerpassword123",
                    confirmPassword: "employerpassword123"
                });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Employer registered successfully');
        });
    });
    describe('Admin User Integration Tests', () => {
        let adminToken: string;
        let adminId: string;

        describe('Registration Tests', () => {
            // Test 1: Admin Registration - Success
            it('Test 1: should register a new admin user successfully', async () => {
                const response = await request(app)
                    .post('/api/admin/register')
                    .send(adminTestUser);
                
                expect(response.status).toBe(201);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('message');
                expect(response.body.data).toHaveProperty('_id');
                expect(response.body.data).toHaveProperty('email', adminTestUser.email);
                adminId = response.body.data._id;
            });

            // Test 2: Admin Registration - Duplicate Email
            it('Test 2: should not register admin with duplicate email', async () => {
                const response = await request(app)
                    .post('/api/admin/register')
                    .send(adminTestUser);
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 3: Admin Registration - Missing Email
            it('Test 3: should reject registration with missing email', async () => {
                const response = await request(app)
                    .post('/api/admin/register')
                    .send({
                        password: 'password123',
                        confirmPassword: 'password123',
                    });
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 4: Admin Registration - Missing Password
            it('Test 4: should reject registration with missing password', async () => {
                const response = await request(app)
                    .post('/api/admin/register')
                    .send({
                        email: 'newadmin@test.com',
                    });
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 5: Admin Registration - Invalid Email Format
            it('Test 5: should reject registration with invalid email format', async () => {
                const response = await request(app)
                    .post('/api/admin/register')
                    .send({
                        email: 'notanemail',
                        password: 'password123',
                        confirmPassword: 'password123',
                    });
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 21: Admin Registration - Password Length Validation
            it('Test 21: should reject registration with weak password', async () => {
                const response = await request(app)
                    .post('/api/admin/register')
                    .send({
                        email: 'weakpass@test.com',
                        password: '123',
                        confirmPassword: '123',
                    });
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 19: Admin Registration - Email Case Insensitivity
            it('Test 19: admin registration should handle emails case-insensitively for duplicates', async () => {
                // Register first admin
                await request(app)
                    .post('/api/admin/register')
                    .send({
                        email: 'testcase@example.com',
                        password: 'password123',
                        confirmPassword: 'password123',
                    });

                // Try to register with same email in different case
                const response = await request(app)
                    .post('/api/admin/register')
                    .send({
                        email: 'TESTCASE@EXAMPLE.COM',
                        password: 'password123',
                        confirmPassword: 'password123',
                    });
                
                // Should fail if case-insensitive checking is implemented
                expect([400, 409]).toContain(response.status);
            });
        });

        describe('Login Tests', () => {
            // Test 6: Admin Login - Success
            it('Test 6: should login admin user successfully', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('token');
                expect(response.body.data).toHaveProperty('email', adminTestUser.email);
                expect(response.body.data).toHaveProperty('role', 'admin');
                adminToken = response.body.token;
            });

            // Test 7: Admin Login - Wrong Password
            it('Test 7: should reject login with wrong password', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: 'wrongpassword'
                    });
                
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 8: Admin Login - User Not Found
            it('Test 8: should reject login for non-existent admin', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: 'nonexistent@test.com',
                        password: 'password123'
                    });
                
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 9: Admin Login - Missing Email
            it('Test 9: should reject login with missing email', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        password: 'password123'
                    });
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 10: Admin Login - Missing Password
            it('Test 10: should reject login with missing password', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email
                    });
                
                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            // Test 22: Admin Login - Response Data Contains Email
            it('Test 22: login response should contain admin email in data', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });
                
                expect(response.body.data.email).toBe(adminTestUser.email);
            });

            // Test 25: Admin Login - Successful Response Message
            it('Test 25: successful admin login should return appropriate message', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('message');
                expect(response.body.message).toMatch(/success|login|welcome/i);
            });

            // Test 20: Admin Login - Response Headers
            it('Test 20: login response should contain appropriate headers', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });
                
                expect(response.headers['content-type']).toMatch(/json/);
            });
        });

        describe('Authentication & Authorization Tests', () => {
            // Test 11: Admin Authentication - Valid Token
            it('Test 11: should access protected route with valid token', async () => {
                const response = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${adminToken}`);
                
                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
            });

            // Test 12: Admin Authentication - Missing Token
            it('Test 12: should reject access to protected route without token', async () => {
                const response = await request(app)
                    .get('/api/admin/users');
                
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message', "Not authorized to access this route");
            });

            // Test 13: Admin Authentication - Invalid Token
            it('Test 13: should reject access with invalid token', async () => {
                const response = await request(app)
                    .get('/api/admin/profile')
                    .set('Authorization', 'Bearer invalidentoken123');
                
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message', "Not authorized to access this route");
            });

            // Test 14: Admin Authentication - Malformed Authorization Header
            it('Test 14: should reject malformed authorization header', async () => {
                const response = await request(app)
                    .get('/api/admin/profile')
                    .set('Authorization', 'InvalidFormat token');
                
                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('message', "Not authorized to access this route");
            });

            // Test 15: Admin Authorization - Role Verification
            it('Test 15: should verify admin role in token', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });
                
                expect(response.body.data).toHaveProperty('role', 'admin');
                expect(response.body.data.role).toBe('admin');
            });

            // Test 23: Admin Authentication - Token Persistence
            it('Test 23: same token should work for multiple requests', async () => {
                const loginResponse = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });

                const token = loginResponse.body.token;

                // First request
                const response1 = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${token}`);

                // Second request with same token
                const response2 = await request(app)
                    .get('/api/admin/users')
                    .set('Authorization', `Bearer ${token}`);

                expect(response1.status).toBe(200);
                expect(response2.status).toBe(200);
            });
        });

        describe('Security Tests', () => {
            // Test 16: Admin Password Security - Hashed Password
            it('Test 16: admin password should be securely hashed', async () => {
                const admin = await AdminUserModel.findById(adminId);
                
                expect(admin).toBeTruthy();
                expect(admin?.password).not.toBe(adminTestUser.password);
                // Password should be hashed (bcrypt hashes start with $2a$, $2b$, etc.)
                expect(admin?.password).toMatch(/^\$2[aby]\$/);
            });

            // Test 18: Admin Login - Token Structure
            it('Test 18: returned token should be a valid JWT-like string', async () => {
                const response = await request(app)
                    .post('/api/admin/login')
                    .send({
                        email: adminTestUser.email,
                        password: adminTestUser.password
                    });
                
                const token = response.body.token;
                expect(token).toBeTruthy();
                expect(typeof token).toBe('string');
                // JWT tokens have 3 parts separated by dots
                expect(token.split('.').length).toBe(3);
            });
        });
    });
});
