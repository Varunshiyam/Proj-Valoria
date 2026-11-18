import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

type ApplicationPayload = {
  Firstname: string;
  Lastname: string;
  email: string;
  password: string;
  Phone: string;
  Degree: string;
  course: string; // Selected internship role
  YOG: number;
};

function isApplicationPayload(value: unknown): value is ApplicationPayload {
  if (!value || typeof value !== 'object') return false;

  const payload = value as Record<string, unknown>;

  return (
    typeof payload.Firstname === 'string' &&
    typeof payload.Lastname === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.password === 'string' &&
    typeof payload.Phone === 'string' &&
    typeof payload.Degree === 'string' &&
    typeof payload.course === 'string' &&
    typeof payload.YOG === 'number' &&
    Number.isInteger(payload.YOG) &&
    payload.YOG > 0
  );
}

export async function POST(request: Request) {
  try {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Please submit a valid internship application.' },
        { status: 400 }
      );
    }

    if (!isApplicationPayload(payload)) {
      return NextResponse.json(
        {
          success: false,
          message: 'One or more required application fields are missing or invalid.',
        },
        { status: 400 }
      );
    }

    const studentData = {
      Firstname: payload.Firstname.trim(),
      Lastname: payload.Lastname.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      Phone: payload.Phone.trim(),
      Degree: payload.Degree.trim(),
      course: payload.course.trim(),
YOG: payload.YOG,
    };

    if (
      !studentData.Firstname ||
      !studentData.Lastname ||
      !studentData.email ||
      !studentData.password ||
      !studentData.Phone ||
      !studentData.Degree ||
      !studentData.course
    ) {
      return NextResponse.json(
        { success: false, message: 'All application fields are required.' },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Internship API] Supabase environment variables are missing.');
      return NextResponse.json(
        { success: false, message: 'Supabase is not configured on the server.' },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { course, ...studentColumns } = studentData;
    const { error } = await supabase
      .from('Students')
      .insert([{ ...studentColumns, Course: course }]);

    if (error) {
      console.error('[Internship API] Supabase insert error:', error);

      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            message: 'An application with this email address or phone number already exists.',
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Unable to save your application. Please check the Students table columns.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Internship API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
