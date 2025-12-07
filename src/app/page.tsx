import {redirect} from 'next/navigation';
 
export default function RootPage() {
  // Middleware handles locale detection and redirect
  // This redirect to root triggers the middleware
  redirect('/');
}
