import prismaClient from "../../prisma";

class ListcategoryService{
    async exevute(){
        const category = await prismaClient.category.findMany({
            select:{
                id: true,
                name: true,
            }    
        })

        return category
    }
}

export {ListcategoryService}