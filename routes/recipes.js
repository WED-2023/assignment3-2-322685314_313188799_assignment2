var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const user_utils = require("./utils/user_utils");


//TODO: TEST WATCHED AND FAFORITED FOR THIS FUNCTION  
/**
 * This is in the home page - returns a 3 random preview-recipes
 */
router.get("/", async (req, res, next) => {
    try {
    const random_recipes = await user_utils.completeUserSpecificPreview(req.session, await recipes_utils.get3RandomPreviwe());    
    res.send(random_recipes);
  } 
  catch (error) {next(error);}
});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    let recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    // Add user-specific info if logged in
    recipe = (await user_utils.completeUserSpecificPreview(req.session, [recipe]))[0];
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const query = req.query.query;
    // logic 
    res.status(200).send({ message: "תוצאות חיפוש" });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
