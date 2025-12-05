import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DisclaimerBanner } from '@/components/ui/legal-disclaimer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, organization_id, organizations(name)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Legal Doc Automation
              </Link>
              <nav className="hidden md:flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/documents"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Documents
                </Link>
                <Link
                  href="/documents/new"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  New Document
                </Link>
                <Link
                  href="/billing"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Billing
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {(profile?.organizations as any)?.name || 'Organization'}
                </p>
              </div>
              <Link
                href="/auth/signout"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Legal Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
