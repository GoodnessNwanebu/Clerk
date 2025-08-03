import { NextRequest, NextResponse } from 'next/server'
import { 
  createCase, 
  getUserCases, 
  getCaseById, 
  updateCaseState,
  createOrGetUser 
} from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'create':
        const { email, country, ...caseData } = data
        
        // Create or get user
        const user = await createOrGetUser(email, country)
        
        // Create case
        const newCase = await createCase({
          ...caseData,
          userId: user.id
        })
        
        return NextResponse.json({ 
          success: true, 
          case: newCase,
          user 
        })

      case 'update':
        const { caseId, updates } = data
        const updatedCase = await updateCaseState(caseId, updates)
        
        return NextResponse.json({ 
          success: true, 
          case: updatedCase 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in cases API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const caseId = searchParams.get('caseId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (caseId) {
      // Get specific case
      const caseData = await getCaseById(caseId)
      if (!caseData) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 })
      }
      return NextResponse.json({ case: caseData })
    }

    if (userId) {
      // Get user's cases
      const cases = await getUserCases(userId, limit)
      return NextResponse.json({ cases })
    }

    return NextResponse.json({ error: 'Missing userId or caseId parameter' }, { status: 400 })
  } catch (error) {
    console.error('Error in cases API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 