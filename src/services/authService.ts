import { LoginAttempt } from "../models/LoginAttempt";
import { logger } from "../config/logger";
import bcrypt from "bcrypt";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

export class AuthService {
  private loginAttempts: Map<string, LoginAttempt> = new Map();

  async login(email: string, passcode: string): Promise<any> {
    try {
      // First check if user exists
      const user = await this.findUser(email);
      if (!user) {
        logger.warn(`Login attempt for non-existent user: ${email}`);
        return {
          success: false,
          message: "Account does not exist",
        };
      }

      const loginAttempt = this.getLoginAttempt(email);

      if (loginAttempt.isLocked()) {
        return {
          success: false,
          message: "Account locked due to too many failed attempts",
        };
      }

      const isPasscodeValid = await bcrypt.compare(passcode, user.passcode);
      if (!isPasscodeValid) {
        this.handleFailedLogin(email);
        const remainingAttempts = loginAttempt.getRemainingAttempts();
        return {
          success: false,
          message: `Invalid credentials. ${remainingAttempts} attempts remaining`,
        };
      }

      // Reset login attempts on successful login
      loginAttempt.reset();
      logger.info(`Successful login for user: ${email}`);

      // Format date of birth to 'Month Day, Year'
      let formattedDob = null;
      if (user.dob) {
        if (user.dob instanceof Timestamp) {
          formattedDob = user.dob.toDate().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } else {
          formattedDob = new Date(user.dob).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        }
      }

      return {
        success: true,
        message: "Login successful",
        user: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          location: user.location,
          interests: user.interests,
          dob: formattedDob,
        },
      };
    } catch (error) {
      logger.error(`Login error for user ${email}:`, error);
      throw error;
    }
  }

  private async findUser(email: string): Promise<any> {
    try {
      const q = query(collection(db, "profiles"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data();
    } catch (error) {
      logger.error("Error finding user:", error);
      throw error;
    }
  }

  private getLoginAttempt(email: string): LoginAttempt {
    if (!this.loginAttempts.has(email)) {
      this.loginAttempts.set(email, new LoginAttempt());
    }
    return this.loginAttempts.get(email)!;
  }

  private handleFailedLogin(email: string): void {
    const loginAttempt = this.getLoginAttempt(email);
    loginAttempt.incrementAttempt();
    logger.warn(
      `Failed login attempt for email ${email}. Attempts remaining: ${loginAttempt.getRemainingAttempts()}`
    );
  }
}
