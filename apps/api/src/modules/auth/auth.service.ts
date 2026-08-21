import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UserStatus, UserRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const role = dto.role || UserRole.STUDENT;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        status: UserStatus.PENDING_VERIFICATION,
        ...(role === UserRole.FACULTY
          ? {
              facultyProfile: {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                },
              },
            }
          : {
              studentProfile: {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  skills: [],
                  interests: [],
                },
              },
            }),
      },
      include: {
        studentProfile: true,
        facultyProfile: true,
      },
    });

    // TODO: Send verification email

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      message: "Registration successful. Please verify your email.",
    };
  }

  async login(dto: LoginDto, userAgent?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException("Account is inactive");
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException("Account is suspended");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate tokens
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
    });

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entity: "user",
        entityId: user.id,
        ipAddress: ip,
        userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);

      // Check if refresh token exists and is not revoked
      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!refreshToken || refreshToken.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Generate new access token
      const newAccessToken = this.jwtService.sign({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    }

    // Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: "LOGOUT",
        entity: "user",
        entityId: userId,
      },
    });

    return { message: "Logged out successfully" };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message: "If the email exists, a reset link has been sent.",
      };
    }

    // TODO: Generate reset token and send email

    return {
      message: "If the email exists, a reset link has been sent.",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: Verify reset token
    // This is a placeholder for the actual implementation

    return { message: "Password reset successful." };
  }
}
