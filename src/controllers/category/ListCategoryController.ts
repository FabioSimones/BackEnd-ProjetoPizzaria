import { Request, Response } from "express";
import { ListcategoryService } from "../../services/category/ListcategoryService";

class ListCategoryController{
    async handle(req: Request, res: Response){
        const listCategoryService = new ListcategoryService();

        const category = await listCategoryService.exevute()

        return res.json(category)
    }
}

export {ListCategoryController}