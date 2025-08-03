'use client'

import React, { useState, useEffect } from 'react'
import { useDatabase } from '../hooks/useDatabase'

export default function DatabaseExample() {
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [user, setUser] = useState<any>(null)
  const [cases, setCases] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  
  const { 
    loading, 
    error, 
    createOrGetUser, 
    getUserCases, 
    getUserStats 
  } = useDatabase()

  const handleCreateUser = async () => {
    if (!email) return
    
    const newUser = await createOrGetUser(email, country)
    if (newUser) {
      setUser(newUser)
      // Load user's cases
      const userCases = await getUserCases(newUser.id)
      setCases(userCases)
      
      // Load user's stats
      const userStats = await getUserStats(newUser.id)
      setStats(userStats)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Database Integration Example</h2>
        
        {/* User Creation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Create/Get User</h3>
          <div className="flex gap-4">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Country (optional)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreateUser}
              disabled={loading || !email}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">User Created/Found</h3>
            <div className="space-y-1 text-sm">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Country:</strong> {user.country || 'Not specified'}</p>
              <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* User Statistics */}
        {stats && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">User Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold">Total Cases</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCases}</p>
              </div>
              <div>
                <p className="font-semibold">Completed Cases</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedCases}</p>
              </div>
              <div>
                <p className="font-semibold">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* User Cases */}
        {cases.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Recent Cases</h3>
            <div className="space-y-2">
              {cases.map((caseItem) => (
                <div key={caseItem.id} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{caseItem.diagnosis}</p>
                      <p className="text-sm text-gray-600">
                        Difficulty: {caseItem.difficultyLevel}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created: {new Date(caseItem.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        caseItem.completedAt 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {caseItem.completedAt ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">How to Use</h3>
          <div className="text-sm space-y-2">
            <p>1. Enter an email address to create or retrieve a user</p>
            <p>2. The system will automatically load the user's cases and statistics</p>
            <p>3. This demonstrates the database integration working in real-time</p>
            <p>4. All data is persisted and can be viewed in Prisma Studio</p>
          </div>
        </div>
      </div>
    </div>
  )
} 