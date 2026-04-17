const teamMembers = await ctx.db.query("teamMembers").collect();
return teamMembers.length;
