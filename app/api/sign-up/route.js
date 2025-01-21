// import dbConnect from "@/lib/dbConnect";
// import User from "@/models/User";
// import bcrypt from "bcryptjs";

// export async function POST(request) {
//   await dbConnect();

//   try {
//     const { name, email, password } = await request.json();

//     // check if user email already exsist?
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return Response.json(
//         {
//           success: false,
//           message: "User already exists",
//         },
//         { status: 400 }
//       );
//     }

//     //If first time user signing up, encrypt password
//     const hashedPassWord = await bcrypt.hash(password, 10);
//     const newUser = new User({
//       name,
//       email,
//       password: hashedPassWord,
//       createdAt,
//       chatHistory: [],
//     });
//     console.log(newUser);

//     // Save new user details to DB
//     await newUser.save();

//     return Response.json(
//       {
//         success: true,
//         message: "User saved successfully",
//       },
//       { status: 200, body: JSON.stringify(newUser) }
//     );
//   } catch (error) {
//     console.error("Error registering User", error);
//     return Response.json(
//       {
//         success: false,
//         message: "Error registering User",
//       },
//       {
//         status: 500,
//       }
//     );
//   }
// }
