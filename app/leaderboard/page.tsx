'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, House, BookOpen, Search, Bot, User } from 'lucide-react'

interface LeaderboardUser {
  id: string
  name: string
  points: number
  rank: number
  avatar: string
  isCurrentUser?: boolean
}

const mockLeaderboard: LeaderboardUser[] = [
  {
    id: '1',
    name: 'Ethan Carter',
    points: 12345,
    rank: 1,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-xdUJ-zNQmAtMJKUnpvZuAWLtL-7hUHDoO2BnfeXpoM-npAmAItwn5DaIrvteesxcjqmkRSyWzFmocobEYeziH__-0suHZEAbjvvyqt9z-D4k1EenGj1ieiHh5cn6O4Q6BP-r2eOk4DkOxK7Stn-QA8VaVASwrtYiBeqCKUxfvNdfqcRd9bf7KSzj19Fq_ZHFOkHAWEt2YdUR7L0-Ao8W0ID5GX1C8nSV_qGVUm0nWp29RfNn-m8CcK3MpVT_6KRq30BQ1N5IDqsa'
  },
  {
    id: '2',
    name: 'Sophia Bennett',
    points: 12340,
    rank: 2,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC88CdHheWF25LCk-OtXh7NgT87zx7MH5no9OlL4daSGkH1NkSWvFg8fXw7w9tNylqbNUrHBAzpcH-_sCiBRWYYkl4aa2zri1Gq-YBfLO54ZueAPOcNcZhbIsfqfKBSRDC3_OWV_VHjO2PG9P2leQXcWtXvxdcqoq8vx5M4Zl-KfxenShkJy0e-LeTOYP8ROJ1gzDiD2O58SV0QRVPpv4vQ11oxh1ONLGlIn9Abw_hpQ5ZbHoJr_v9ZYw_9N56WzpWOxkN-xAkjkwzS'
  },
  {
    id: '3',
    name: 'Liam Harper',
    points: 12335,
    rank: 3,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByZ1uDfALME5pTwj19ZT8VwMKLjOdGwEyvQZQjQ9GaMq35gw93OanTkU0wwyFNLBorqrz4v1ztKP0xZpBtQxz9zmIH0xhdN-baTvsCiIZE95B2lNQzMt5l8wy9K90rIhPb6WKPrGOtsvX0RARSosbMZeVkB-jzUHDTqZshnodiEzFWpafy99KpmOyOMZTrEIBXYWOIRevpkYdMyr6JPySvRDg__qUTk_6qBZ3uD2Wtrhq76RqjQH9RCgT5tAZ9RJcCmIHC0oxrBgyn'
  },
  {
    id: '4',
    name: 'Olivia Foster',
    points: 12330,
    rank: 4,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAI1XFbtw8O-y1b-D2RN_DpOnixrCJh_eudJ-KW-ZJiWZ7KauDvHQFJXy3L7TeF4O8ivhvgQdtjfdU-i42jXMDlWwq7155tleSgBeRL1ABR3xYcz5UeUEq9RTAjyq7w85p1l-5nA4xjBDCnXD6LxzCbq7JV0zhLS_hNN688bry1F_s7JhBM5Q9yuoUr-TfHhs-GuPgKICHqKBANcv6aacUiPtSxFdhZoaJWrZd_L0g2dqJSL_vv4-EM9VmiYivC2enCRyAuhMY7BGc0'
  },
  {
    id: '5',
    name: 'Noah Parker',
    points: 12325,
    rank: 5,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5ve1rEt2y8BWWjmKwaXvGTtEYLhmN2oyp--p30aB6NZgDVAb1eyieUl5uFo-gVCHudl4JfB_8-ciQ0f_UEnXu6p_iFFLwczm-qznNHcfhlMkt1LxLBNWW5JQVQ25nAXCOUIz4Ejt7kQK7KA6gC6imFAIiKAck3FXb8tnQXIAaJwceCs8br2GwriaK4XdjqWeMvE6jr6csbNznibJJ6Ugb3f_JF7n6pvQyBVyHYwal0cTS4HR-9_dooU8r_C-kBZCCVzEO7NqOmS4U'
  },
  {
    id: '6',
    name: 'Ava Mitchell',
    points: 12320,
    rank: 6,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATNfIFqY4cETENKaIdzDlz-_yrLL3Hl1zXQA8IeuiU2oxIIo1XhWgMuvkHQ_6BLqXrx7NxkjyfdqeRljPKzC8oFpKCFzFIxwW0b-8-RuuRV2u3xqUc03lR7w6bRgOWXizH2Wz3aGtN06_AUX3nOUb0U-d01yajct0B3tm-SDv2LJocANfBkALwT5uryN7ZJilTnHAMcV6QmRPFqi6u-OECyl6s0ldVVk6wHu_cv2C45RoAj863EI4fxGes85W8DwityXInEVjFp3TK'
  },
  {
    id: '7',
    name: 'Jackson Reed',
    points: 12315,
    rank: 7,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM8Pok98psTlP_tI_c0TlXrQrauW33XPNVDMk7LpSY4y0dJi9dzahGjRO_pF95Qq89iSJyK8hXTZNwNwR504KSzyrA0WmDfOUh1Hg6w6eDEF6l6kD6s-Q6VKMIksMIV8xi8pvBZQLpyKgUDRM3tu4X3Njki7mU5iVaKBCybGwRZRqc3FXhK-TkzCmXmLoSu-yLSLefJZj97JFzDi6lRRdfEjwocyLn6-Gb2e3Zy70V6LGmR-M7ejVppGa5vLcOo-mohOZbtjQrWOU6'
  },
  {
    id: '8',
    name: 'Isabella Hayes',
    points: 12310,
    rank: 8,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpcZ9sdn97_B281HNhyCEFsaQ6t95NgxUQAIJfFPfkcURJpizL-KHlmtTTEVJECLd-2dPRzUlPuxYQOlz3dmC5Z4tQlNItdeoyRQHnVdx5Ex1rmRmf5-bCrcRBacn75HPSqT137QCeYvHIajlWU3tAfaPEeASbNQwQN3ZeIlnE0y_tOc4pLwp3apD4GYI42eDSiEgRb18cp9b164lNYHvuCMaMJNKRJLd9vXEA0odgM7E7e812dr9eCoHWhxO7m0zz1YCK4fvZ0W--'
  },
  {
    id: '9',
    name: 'Lucas Coleman',
    points: 12305,
    rank: 9,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPggPtF2H3e7NlayB4WeB5jqdBmwYkG_EKAXOdtrIVzPv7Gyh4Siq0yi67YbBpyycFD6i437GRlzkdP998ZgEPdByj0H0cwfrQi_IUncavcPdjTyAk3U3-Bbqib2YtKk9_7ven0Pa6OOUw42pcBS3GXp7Tyl7P8jOHOVYAZvGf0Vtom3FKDCDqwA0SHVviN-ClshlMb3yBxHbidZUywzL2UqrqccWYBN04HRCWWo0aGbUJXoqUCGGJtCTmHsGWV-FL-7miYH1DaSUY'
  },
  {
    id: '10',
    name: 'Mia Bennett',
    points: 12300,
    rank: 10,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqznWwNdVF0Sh2ufGtX5tvluxx3eGSlrh2GtF7BGKZFLR2JvZ16ZrsdUQz69JM-Jymjjo-SI5PYoFuT_UVeq1gR37F_JX2-yhA4PDwxpUkb31jRWRNGn8N21UfEx8-apJCeJ3gIbMR-0NBN7dzV1y8hAEeNt15EQ2u_o5TodOKtBQZAAWgg7rjg5G8TCouDOWHFxrL0zNQc-J0-sSFFMojEYMIEB4PjeWY0oKfuit09Vgo-vl-4qeopukgaWeimsIrMRLsgRKoD5mA'
  }
]

const currentUser: LeaderboardUser = {
  id: 'current',
  name: 'You',
  points: 12295,
  rank: 11,
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIt8tY-lzC3H2UQuBhKSf9H6t_4JX4iz9T1PHE2ouYMd4__WcOnuw820J-fPy1hiEnJj4Ywcyk8UBoRl7TEauJIIv1_UAnuAyzkkgGBW4lZucEGjrfGq8zAmYkiEfHRqelyjWQJHxIrCUU4DwIcvXEYeBlklgf58WEnc6KVyvmr4crEUquSngLvlfRp7HMx3NpTJkCuxKfa2pam9dpN5703ahcPiQz5M3dhputlEbbT2GyD014qE6Et_KPYiBtu2oEt78zPpvN4v9p',
  isCurrentUser: true
}

export default function LeaderboardPage() {
  const [selectedTab, setSelectedTab] = useState<'friends' | 'all'>('all')

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600'
    if (rank === 2) return 'text-gray-600'
    if (rank === 3) return 'text-orange-600'
    return 'text-gray-900'
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 justify-between">
      {/* Header */}
      <div className="flex items-center bg-gray-50 p-4 pb-2 justify-between">
        <button className="text-gray-900 flex size-12 shrink-0 items-center justify-center">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-12">
          Leaderboard
        </h2>
      </div>

      {/* Tab Selector */}
      <div className="flex px-4 py-3">
        <div className="flex h-10 flex-1 items-center justify-center rounded-full bg-gray-200 p-1">
          <button
            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 text-sm font-medium leading-normal transition-all ${
              selectedTab === 'friends' 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600'
            }`}
            onClick={() => setSelectedTab('friends')}
          >
            <span className="truncate">Friends</span>
          </button>
          <button
            className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 text-sm font-medium leading-normal transition-all ${
              selectedTab === 'all' 
                ? 'bg-white shadow-sm text-gray-900' 
                : 'text-gray-600'
            }`}
            onClick={() => setSelectedTab('all')}
          >
            <span className="truncate">All</span>
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1">
        {/* Top 3 Podium */}
        <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">🏆 Top Performers</h3>
            <div className="flex justify-center items-end gap-4">
              {mockLeaderboard.slice(0, 3).map((user, index) => (
                <div key={user.id} className={`flex flex-col items-center ${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'}`}>
                  <div
                    className={`bg-center bg-no-repeat aspect-square bg-cover rounded-full border-4 ${
                      index === 0 ? 'w-16 h-16 border-yellow-400' : 
                      index === 1 ? 'w-14 h-14 border-gray-400' : 
                      'w-12 h-12 border-orange-400'
                    }`}
                    style={{ backgroundImage: `url("${user.avatar}")` }}
                  />
                  <p className={`font-bold mt-2 text-sm ${getRankColor(user.rank)}`}>
                    {getRankBadge(user.rank)}
                  </p>
                  <p className="text-xs text-gray-600 text-center">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.points.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rest of Leaderboard */}
        <div className="space-y-1">
          {mockLeaderboard.slice(3).map((user) => (
            <div key={user.id} className="flex items-center gap-4 bg-gray-50 px-4 min-h-[72px] py-2 justify-between hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div
                  className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14 border-2 border-white shadow-sm"
                  style={{ backgroundImage: `url("${user.avatar}")` }}
                />
                <div className="flex flex-col justify-center">
                  <p className="text-gray-900 text-base font-medium leading-normal line-clamp-1">
                    {user.name}
                  </p>
                  <p className="text-gray-600 text-sm font-normal leading-normal line-clamp-2">
                    {user.points.toLocaleString()} points
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <p className={`text-base font-normal leading-normal ${getRankColor(user.rank)}`}>
                  #{user.rank}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current User Position */}
      <div className="border-t border-gray-200 bg-white">
        <div className="flex items-center gap-4 bg-blue-50 px-4 min-h-[72px] py-2 justify-between border border-blue-200 mx-4 my-3 rounded-lg">
          <div className="flex items-center gap-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-14 w-14 border-2 border-blue-400 shadow-sm"
              style={{ backgroundImage: `url("${currentUser.avatar}")` }}
            />
            <div className="flex flex-col justify-center">
              <p className="text-gray-900 text-base font-medium leading-normal line-clamp-1">
                {currentUser.name}
              </p>
              <p className="text-gray-600 text-sm font-normal leading-normal line-clamp-2">
                {currentUser.points.toLocaleString()} points
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <p className="text-gray-900 text-base font-normal leading-normal">
              #{currentUser.rank}
            </p>
          </div>
        </div>
      </div>

      {/* Safe area for mobile */}
      <div className="h-5 bg-gray-50"></div>
    </div>
  )
}