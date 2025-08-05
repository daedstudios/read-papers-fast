import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get the Clerk client instance
    const client = await clerkClient();
    
    // Get current user to access metadata
    const user = await client.users.getUser(userId);
    console.log('Current user metadata:', user.privateMetadata);
    console.log('Current user public metadata:', user.publicMetadata);
    const currentMetadata = user.publicMetadata as any || {};

    // Check if user is initialized
    const isInitialized = currentMetadata.firstSearch !== undefined;
    
    let updatedMetadata;

    if (!isInitialized) {
      // Initialize user search metadata
      updatedMetadata = {
        ...currentMetadata,
        numberOfSearches: 1,
        firstSearch: new Date().toISOString(),
        freeSearchesRemaining: 2 // Start with 2 remaining since we're using 1
      };
    } else {
      // Increment search count
      const currentSearches = currentMetadata.numberOfSearches || 0;
      const currentRemaining = currentMetadata.freeSearchesRemaining || 0;
      
      updatedMetadata = {
        ...currentMetadata,
        numberOfSearches: currentSearches + 1,
        freeSearchesRemaining: Math.max(0, currentRemaining - 1),
        lastSearch: new Date().toISOString()
      };
    }

    // Update user metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: updatedMetadata,
    });

    // Return true if searches are available, false if limit reached
    const hasSearchesAvailable = updatedMetadata.freeSearchesRemaining > 0;

    return NextResponse.json(hasSearchesAvailable);

  } catch (error) {
    console.error("Error managing user limits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
