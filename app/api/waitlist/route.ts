import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const client = new MongoClient(uri);
const dbName = "Waitlist-RPF";
const collectionName = "Signups";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "Already on the list" },
        { status: 200 }
      );
    }

    await collection.insertOne({ email, timestamp: new Date() });

    return NextResponse.json(
      { message: "Signed up successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("MongoDB error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
