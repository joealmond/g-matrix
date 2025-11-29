'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { User } from 'lucide-react';


export default function AccountPage() {

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <User className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="font-headline text-2xl">
            User Account
          </CardTitle>
          <CardDescription>
            Account management is currently disabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-center">
               <p className="text-muted-foreground">Please check back later.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
