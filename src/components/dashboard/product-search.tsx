import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function ProductSearch() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Find Your Vibe</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex w-full items-center space-x-2">
          <Input
            type="search"
            placeholder="Search for a gluten-free product..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
