import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const addDummyParticipants = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all events
    const events = await ctx.db.query("events").collect();
    
    if (events.length === 0) {
      return { success: false, message: "No events found to add participants to" };
    }

    // Create sample users if they don't exist
    const sampleUsers = [
      { name: "Alice Johnson", email: "alice.johnson@example.com", role: "user" as const, rollNo: "CS001", branch: "Computer Science", mobileNumber: "+1234567890" },
      { name: "Bob Smith", email: "bob.smith@example.com", role: "user" as const, rollNo: "CS002", branch: "Computer Science", mobileNumber: "+1234567891" },
      { name: "Charlie Brown", email: "charlie.brown@example.com", role: "user" as const, rollNo: "EE001", branch: "Electrical Engineering", mobileNumber: "+1234567892" },
      { name: "Diana Prince", email: "diana.prince@example.com", role: "user" as const, rollNo: "ME001", branch: "Mechanical Engineering", mobileNumber: "+1234567893" },
      { name: "Ethan Hunt", email: "ethan.hunt@example.com", role: "user" as const, rollNo: "CS003", branch: "Computer Science", mobileNumber: "+1234567894" },
      { name: "Fiona Green", email: "fiona.green@example.com", role: "user" as const, rollNo: "CE001", branch: "Civil Engineering", mobileNumber: "+1234567895" },
      { name: "George Wilson", email: "george.wilson@example.com", role: "user" as const, rollNo: "CS004", branch: "Computer Science", mobileNumber: "+1234567896" },
      { name: "Hannah Lee", email: "hannah.lee@example.com", role: "user" as const, rollNo: "EE002", branch: "Electrical Engineering", mobileNumber: "+1234567897" },
      { name: "Ian Malcolm", email: "ian.malcolm@example.com", role: "user" as const, rollNo: "BT001", branch: "Biotechnology", mobileNumber: "+1234567898" },
      { name: "Julia Roberts", email: "julia.roberts@example.com", role: "user" as const, rollNo: "CS005", branch: "Computer Science", mobileNumber: "+1234567899" },
    ];

    const userIds = [];
    
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", userData.email))
        .unique();
      
      if (existingUser) {
        userIds.push(existingUser._id);
      } else {
        const userId = await ctx.db.insert("users", userData);
        userIds.push(userId);
      }
    }

    // Add registrations for each event
    let totalRegistrations = 0;
    
    for (const event of events) {
      // Randomly select 3-7 users for each event
      const numParticipants = Math.floor(Math.random() * 5) + 3; // 3 to 7 participants
      const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);
      const selectedUsers = shuffledUsers.slice(0, numParticipants);
      
      for (const userId of selectedUsers) {
        // Check if registration already exists
        const existingRegistration = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_user_and_event", (q) => 
            q.eq("userId", userId).eq("eventId", event._id)
          )
          .unique();
        
        if (!existingRegistration) {
          await ctx.db.insert("eventRegistrations", {
            eventId: event._id,
            userId: userId,
            registrationDate: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
            status: "registered" as const,
          });
          totalRegistrations++;
        }
      }
    }

    return {
      success: true,
      message: `Created ${userIds.length} sample users and ${totalRegistrations} event registrations`,
      usersCreated: userIds.length,
      registrationsCreated: totalRegistrations,
    };
  },
});