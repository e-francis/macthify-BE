import { db, storage } from "../config/firebase";
import { Profile } from "../models/Profile";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { logger } from "../config/logger";
import bcrypt from "bcrypt";

export class ProfileService {
  async createProfile(profileData: any): Promise<string> {
    try {
      logger.info("Creating profile for user:", profileData.email);

      // Check if the email already exists
      const existingUser = await this.findByEmail(profileData.email);
      if (existingUser) {
        throw new Error("Email already exists");
      }

      // Validate passcode and convert to a string
      const passcode = parseInt(profileData.passcode);
      if (isNaN(passcode) || passcode.toString().length !== 6) {
        throw new Error("Passcode must be a 6-digit number");
      }

      // Ensure profile picture exists
      if (!profileData.profilePicture) {
        throw new Error("Profile picture is required");
      }

      // Upload Base64 image to Firebase Storage
      const pictureUrl = await this.uploadProfilePicture(
        profileData.profilePicture,
        profileData.email
      );

      // Create profile instance
      const profile = new Profile(
        profileData.firstName,
        profileData.lastName,
        new Date(profileData.dob),
        profileData.location,
        pictureUrl, // Use the Firebase Storage URL
        profileData.interests,
        profileData.sex.toLowerCase(),
        profileData.email,
        passcode
      );

      // Add profile to Firestore
      const docRef = await addDoc(collection(db, "profiles"), {
        ...profile.toJSON(),
        passcode: await this.hashPasscode(passcode), // Store hashed passcode
      });

      logger.info(`Profile created successfully with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      logger.error("Error creating profile:", error);
      throw error;
    }
  }

  private async uploadProfilePicture(
    base64Image: string,
    email: string
  ): Promise<string> {
    try {
      if (!base64Image?.trim()) {
        throw new Error("Profile picture is empty");
      }

      const validMimeTypes = [
        "data:image/jpeg;base64,",
        "data:image/jpg;base64,",
        "data:image/png;base64,",
        "data:image/gif;base64,",
      ];
      if (!validMimeTypes.some((type) => base64Image.startsWith(type))) {
        throw new Error("Invalid image format. Must be JPEG, JPG, PNG, or GIF");
      }

      // Create a unique storage path
      const timestamp = Date.now();
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9]/g, "_");
      const extension = base64Image.startsWith("data:image/png")
        ? ".png"
        : ".jpg";
      const picturePath = `profiles/${timestamp}_${sanitizedEmail}${extension}`;

      logger.info("Uploading image to path:", picturePath); // Log the path for debugging

      // Upload Base64 image to Firebase Storage
      const storageRef = ref(storage, picturePath);
      await uploadString(storageRef, base64Image, "data_url");

      // Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      logger.info("Image uploaded successfully to:", picturePath);
      return downloadUrl;
    } catch (error: any) {
      logger.error("Error uploading profile picture:", error);
      throw new Error("Failed to upload profile picture: " + error.message);
    }
  }

  private async hashPasscode(passcode: number): Promise<string> {
    const passcodeString = passcode.toString(); // Convert number to string
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(passcodeString, salt);
  }

  private async findByEmail(email: string): Promise<any> {
    try {
      const q = query(collection(db, "profiles"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : querySnapshot.docs[0].data();
    } catch (error: any) {
      logger.error("Error querying profiles by email:", error);
      throw new Error("Failed to query profiles by email");
    }
  }
}
