// const userData = (await userFinder(data?.userId)) as User;

//             const payload = {
//               avatar: userData?.image,
//               userId: userData?.id,
//               userName: userData?.userName,
//               thumbnailUrl: order?.projectImage,
//               type: NotificationTypes.Order,
//               createdAt: new Date(),
//             }

//             await prisma.notification.create({
//               data: {
//                 recipient: 'ADMIN',
//                 message: `You have a new order from ${userData?.userName} and are awaiting buyer requirements.`,
//                 senderId: data?.userId as string,
//                 payload: payload
//               }
//             })
//             PublicMessageHandler({
//               msg: `
//               <div className="flex-1">
//         <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
//           {'You have a new '}
//           <span className="font-bold">order</span>
//           {'from'}
//           <span className="font-bold">${userData.role}</span>
//           {'and are awaiting buyer requirements.'}
//         </p>
//       </div>
//       `,
//               avatar: userData.image,
//               userId: userData.id,
//               userName: userData.userName,
//               thumbnailUrl: order.projectImage,
//               type: NotificationTypes.Order,
//               createdAt: new Date(),
//             }, userData.role);