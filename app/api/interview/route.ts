import { NextRequest, NextResponse } from 'next/server';
import { InterviewManager, SkillRating, QuestionWithType } from '@/lib/interview/InterviewManager';

const interviewManager = new InterviewManager();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'initialize':
        const { studentId, skillRatings, config } = params;
        const session = await interviewManager.initializeSession(
          studentId,
          skillRatings as SkillRating[],
          config
        );
        return NextResponse.json({ success: true, session });

      case 'getNextQuestion':
        const { sessionId, focusedTechnology } = params;
        const question = await interviewManager.getNextQuestion(sessionId, focusedTechnology);
        return NextResponse.json({ success: true, question });

      case 'submitResponse':
        const { sessionId: responseSessionId, questionId, response, responseType } = params;
        const evaluation = await interviewManager.submitResponse(
          responseSessionId,
          questionId,
          response,
          responseType
        );
        return NextResponse.json({ success: true, evaluation });

      case 'getProgress':
        const { sessionId: progressSessionId } = params;
        const progress = await interviewManager.getSessionProgress(progressSessionId);
        return NextResponse.json({ success: true, progress });

      case 'endSession':
        const { sessionId: endSessionId } = params;
        const endedSession = await interviewManager.endSession(endSessionId);
        return NextResponse.json({ success: true, session: endedSession });

      case 'getHistory':
        const { studentId: historyStudentId } = params;
        const history = await interviewManager.getStudentHistory(historyStudentId);
        return NextResponse.json({ success: true, history });

      case 'seedQuestions':
        await interviewManager.seedQuestions();
        return NextResponse.json({ success: true, message: 'Questions seeded successfully' });

      case 'setSubjectRating':
        const { sessionId: ratingSessionId, subject, rating } = params;
        const ratingResult = await interviewManager.setSubjectRating(ratingSessionId, subject, rating);
        return NextResponse.json({ success: ratingResult });

      case 'skipSubject':
        const { sessionId: skipSessionId, subject: skipSubject } = params;
        const skipResult = await interviewManager.handleSubjectSkip(skipSessionId, skipSubject);
        return NextResponse.json({ success: skipResult });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Interview API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const sessionId = searchParams.get('sessionId');
  const studentId = searchParams.get('studentId');

  try {
    switch (action) {
      case 'getProgress':
        if (!sessionId) {
          return NextResponse.json({ success: false, error: 'Session ID required' }, { status: 400 });
        }
        const progress = await interviewManager.getSessionProgress(sessionId);
        return NextResponse.json({ success: true, progress });

      case 'getHistory':
        if (!studentId) {
          return NextResponse.json({ success: false, error: 'Student ID required' }, { status: 400 });
        }
        const history = await interviewManager.getStudentHistory(studentId);
        return NextResponse.json({ success: true, history });

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Interview API GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}