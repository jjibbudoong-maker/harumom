'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PenLine, BarChart2, Lightbulb, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', icon: Home,      label: '홈'      },
  { href: '/log',       icon: PenLine,   label: '기록'    },
  { href: '/charts',    icon: BarChart2, label: '차트'    },
  { href: '/insights',  icon: Lightbulb, label: '인사이트' },
  { href: '/settings',  icon: Settings,  label: '설정'    },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-ap-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all',
                isActive
                  ? 'text-ap-blue'
                  : 'text-ap-muted hover:text-ap-text'
              )}
            >
              {isActive && (
                <span className="absolute -translate-y-7 w-8 h-0.5 bg-ap-blue rounded-full" />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={cn(
                'text-[10px] font-semibold tracking-wide',
                isActive ? 'text-ap-blue' : 'text-ap-muted'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
