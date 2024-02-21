import prisma from "../../prisma/prisma.js";

const connectDb = async () => {
  try {
    await prisma.$connect();
    console.log(`Db Connected`);
  } catch (error) {
    console.log("Unable to connec to Db", error);
    process.exit(1);
  }
};

export default connectDb;
