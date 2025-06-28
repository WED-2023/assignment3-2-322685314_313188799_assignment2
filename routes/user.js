var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware -> to prevent not-allowd user to performed a sign-up user actions 
 */
router.use(async function (req, res, next) {
  console.log("Session data:", req.session);
  if (req.session && req.session.user_id) {
    try {
      const users = await DButils.execQuery("SELECT userID FROM users");
      const userExists = users.find((x) => x.userID === req.session.user_id);
      if (userExists) {
        req.user_id = req.session.user_id;
        next();
      } else {
        res.status(401).send("Unauthorized: user not found");
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeID;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    // getFavoriteRecipes returns an array of {recepieID: U_ID or ID}. 
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipeID)); //extracting the recipe ids into array
    const results = await user_utils.completeUserSpecificPreview(req.session, await recipe_utils.getRecipesPreview(recipes_id_array));
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});

/**
 * This path deletes a favorited recipe from the favorites list of the logged-in user
 */
router.delete('/favorites/:recipeID', async (req, res, next) => {
  try {
    const user_id = req.session.user_id;
    const recipeID = req.params.recipeID;

    const isFavorite = await user_utils.isFavoriteByUser(user_id, recipeID);
    if (!isFavorite) {
      res.status(404).send({ message: "Recipe not found in favorites" });
      return;
    }
    await user_utils.removeFavoriteRecipe(user_id, recipeID);
    res.status(200).send({ message: "Recipe successfully removed from favorites" });
  } catch (error) {
    next(error);
  }
});

// Mark recipeID as watched for current user session - make this action tranperent in frounted
router.post("/watch", async (req, res, next) => {
    try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeID;
    await user_utils.markAsWatched(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as watched");
    } catch(error){
    next(error);
  }
});


router.get("/watch", async (req, res, next) => {
    try{
    const user_id = req.session.user_id;
    // getWatchedRecipes returns an array of {recepieID: xx}. Note - this is a Spooncular type of recipe ID.
    const recipes_id = await user_utils.getWatchedRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipeID)); //extracting the recipe ids into array
    const results = await user_utils.completeUserSpecificPreview(req.session, await recipe_utils.getRecipesPreview(recipes_id_array));
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


/**
 * This path gets body with recipe details and create a new record for a 'my recipes' list of the logged-in user
 */
router.post('/recipes', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_details = req.body;
    const status = await user_utils.createNewRecipe(user_id, recipe_details);
    if (!status.success)
      return res.status(500).send("Server failed to add new recipe");
    res.status(200).send(`Recipe added to list ${status.recipeID}`);
    } catch(error){
    next(error);
  }
});

router.get("/recipes", async (req, res, next) => {
  try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getUserRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipeID)); //extracting the recipe ids into array
    console.log(`User recipes by id: ${recipes_id_array}`);
    const results = await user_utils.completeUserSpecificPreview(req.session, await recipe_utils.getRecipesPreview(recipes_id_array));
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});


router.delete("/recipes/:recipeID", async (req, res, next) => {
  try {
    const recipeID = req.params.recipeID;
    const recipeIDformat = `U_${recipeID}`;
    await user_utils.removeUserRecipe(recipeIDformat);
    res.status(200).send({ message: "Recipe successfully removed from favorites" });
  } catch (error) {
    next(error);
  }
});


router.get('/family', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const family_recipes = await user_utils.getFamilyRecipes(user_id);
    if (family_recipes.length === 0) {
       return res.status(404).send("No family recipes found for this user");
    }
    res.status(200).send(family_recipes);
  } catch (error) {
    console.error("Error fetching family recipes:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

router.get("/check-username", async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).send({ message: "Username is required", success: false });
    }

    const users = await DButils.execQuery(
      `SELECT username FROM users WHERE username = '${username}'`
    );

    const exists = users.length > 0;
    res.status(200).send({ exists, success: true });

  } catch (err) {
    next(err); 
  }
});
module.exports = router;
