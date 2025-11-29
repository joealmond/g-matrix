import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const trendingFoods = [
  { name: 'Canyon Bakehouse Bread', imageId: '1', safe: 95, taste: 90 },
  { name: 'King Arthur Flour', imageId: '2', safe: 98, taste: 95 },
  { name: 'Snyders GF Pretzels', imageId: '3', safe: 75, taste: 92 },
  { name: 'Oreo Gluten Free', imageId: '4', safe: 60, taste: 98 },
];

export function TrendingFoods() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Trending Safe Foods</CardTitle>
        <CardDescription>Community-vouched safe products</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {trendingFoods.map(food => {
            const image = PlaceHolderImages.find(img => img.id === food.imageId);
            const safetyColor = food.safe > 70 ? 'text-green-400' : food.safe > 40 ? 'text-yellow-400' : 'text-red-400';
            const tasteColor = food.taste > 70 ? 'text-primary' : food.taste > 40 ? 'text-yellow-400' : 'text-blue-400';

            return (
              <li key={food.name} className="flex items-center gap-4">
                <Avatar className="h-12 w-12 rounded-lg">
                  {image && (
                    <AvatarImage
                      src={image.imageUrl}
                      alt={food.name}
                      className="object-cover"
                      data-ai-hint={image.imageHint}
                    />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {food.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{food.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className={`font-bold ${safetyColor}`}>{food.safe}% Safe</span>
                    <span>•</span>
                    <span className={`font-bold ${tasteColor}`}>{food.taste}% Taste</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
