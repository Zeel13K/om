// import { Link, useLocation } from 'react-router-dom';
// import { Camera, History, Users, FileText } from 'lucide-react';

// const Navbar = () => {
//   const location = useLocation();

//   const isActive = (path) => {
//     return location.pathname === path;
//   };

//   return (
//     <nav className="bg-white shadow-lg border-b">
//       <div className="container mx-auto px-4">
//         <div className="flex justify-between items-center py-4">
//           <Link to="/" className="flex items-center space-x-2">
//             <Camera className="h-8 w-8 text-blue-600" />
//             <span className="text-xl font-bold text-gray-800">OM Photography</span>
//           </Link>
          
//           <div className="flex space-x-6">
//             <Link
//               to="/"
//               className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
//                 isActive('/') 
//                   ? 'bg-blue-100 text-blue-700' 
//                   : 'text-gray-600 hover:text-blue-600'
//               }`}
//             >
//               <FileText className="h-5 w-5" />
//               <span>New Quotation</span>
//             </Link>
            
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar; 