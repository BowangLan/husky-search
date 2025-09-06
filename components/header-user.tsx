"use client"

import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import { LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function HeaderUser() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  const getUserInitials = (
    firstName?: string | null,
    lastName?: string | null,
    email?: string | null
  ) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    return "U"
  }

  const getUserDisplayName = (
    firstName?: string | null,
    lastName?: string | null,
    email?: string | null
  ) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (firstName) {
      return firstName
    }
    if (email) {
      return email
    }
    return "User"
  }

  if (!isLoaded) {
    return (
      <Button
        variant="ghost"
        className="relative h-8 w-8 rounded-full"
        disabled
      />
    )
  }

  if (!isSignedIn || !user) {
    return (
      <Link href="/sign-in">
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
    )
  }

  const firstName = user.firstName ?? null
  const lastName = user.lastName ?? null
  const email = user.primaryEmailAddress?.emailAddress ?? null

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user.imageUrl}
              alt={getUserDisplayName(firstName, lastName, email)}
            />
            <AvatarFallback className="text-xs">
              {getUserInitials(firstName, lastName, email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName(firstName, lastName, email)}
            </p>
            {email && (
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
