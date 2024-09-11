// Initialize Prisma Client
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getAllFoldersController = async (req, res) => {
  try {
    // Fetch all upload designs
    const uploadDesigns = await prisma.uploadDesign.findMany();

    if (!Array.isArray(uploadDesigns)) {
      return res.status(400).json({ error: "Invalid data format" });
    }

    // Create a unique slug to folder map
    const uniqueFolders = new Map();

    for (const design of uploadDesigns) {
      const slug = design.folder.split(" ").join("-").toLowerCase();
      if (!uniqueFolders.has(slug)) {
        uniqueFolders.set(slug, design.folder);
      }
    }

    // Fetch all existing folders and sort by order
    const existingFolders = await prisma.featureAllFolder.findMany({
      orderBy: {
        order: "asc", // Ensure folders are sorted by 'order' field in ascending order
      },
    });

    const existingFolderSlugs = new Set(
      existingFolders.map((folder) => folder.slug)
    );

    // Determine folders to delete
    const foldersToDelete = existingFolders.filter(
      (folder) => !uniqueFolders.has(folder.slug)
    );
    const deletePromises = foldersToDelete.map((folder) =>
      prisma.featureAllFolder.delete({
        where: { id: folder.id },
      })
    );

    // Process folder creation/updating
    const folderPromises = Array.from(uniqueFolders.keys()).map(
      async (slug) => {
        let folder = await prisma.featureAllFolder.findUnique({
          where: { slug },
        });

        if (!folder) {
          folder = await prisma.featureAllFolder.create({
            data: {
              slug,
              folder: uniqueFolders.get(slug),
              order: await prisma.featureAllFolder.count(), // You might want to use a more reliable order strategy
            },
          });
        }

        return folder;
      }
    );

    // Execute delete and create/update operations
    await Promise.all(deletePromises);
    const folders = await Promise.all(folderPromises);

    res.status(200).json({
      message: "Folders Resolved Successfully",
      data: folders.sort((a, b) => a.order - b.order),
    }); // Ensure the final output is sorted
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Folders Resolved Failed");
  }
};

export const updateFolderByOrder = async (req, res) => {
  const { newOrder } = req.body; // newOrder should be an array of items with their new positions
  try {
    // Start a transaction to update multiple records
    await prisma.$transaction(
      newOrder.map((item, index) =>
        prisma.featureAllFolder.update({
          where: { id: item.id },
          data: { order: index },
        })
      )
    );
    res.status(200).send("Order updated successfully");
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send("Error updating order");
  }
};
