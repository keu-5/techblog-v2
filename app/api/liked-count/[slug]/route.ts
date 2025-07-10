import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const response = await fetch(
      `https://api.counterapi.dev/v2/${process.env.COUNTERAPI_WORKSPACE}/${params.slug}-liked`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COUNTERAPI_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch liked count");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch liked count" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const response = await fetch(
      `https://api.counterapi.dev/v2/${process.env.COUNTERAPI_WORKSPACE}/${params.slug}-liked/up`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COUNTERAPI_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to increment liked count");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to increment liked count" },
      { status: 500 },
    );
  }
}
