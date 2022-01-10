class Recipe {
    constructor(name, ingredients = []) {
        this.name = name;
        this.ingredients = ingredients;
    }

    equals(other) {
        return this.name == other.name;
    }

    toString() {
        return this.ingredients.join(', ');
    }

}

function id(text) {
    return text.replace(/\s/g, "_");
}

const LOCAL_STORAGE_KEY = '_username_recipes';


class RecipesApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            recipes: this.loadRecipes()
        }
        this.addRecipe = this.addRecipe.bind(this);
        this.removeRecipe = this.removeRecipe.bind(this);
        this.editRecipe = this.editRecipe.bind(this);
    }

    // if there are previously saved recipes load them, otherwise use some default as example
    loadRecipes() {
        let recipes = [new Recipe('orange juice', ['orange']), new Recipe('lemonade', ['lemon', 'sugar'])];
        let arr = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
        if (arr) {
            recipes = arr.map(value => {
                return new Recipe(value.name, value.ingredients);
            });
        }
        console.log(recipes);
        return recipes;
    }

    isRecipeUnique(recipe) {
        for (let r of this.state.recipes)
            if (recipe.equals(r))
                return false;
        return true;
    }

    saveRecipes(recipes) {
        // setState is asynchronous but there is no need to wait for it before updating localStorage
        this.setState({ recipes: recipes });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recipes));
    }

    addRecipe(name, ingredients) {
        let recipe = new Recipe(name, ingredients);
        if (this.isRecipeUnique(recipe)) {
            let recipes = this.state.recipes.concat(recipe);
            this.saveRecipes(recipes);
        }
        else {
            alert('Cannot add recipe, "' + name + '" already exists.');
        }
    }

    removeRecipe(recipe) {
        let recipes = this.state.recipes.filter(value => {
            return !recipe.equals(value);
        });
        this.saveRecipes(recipes);
    }

    editRecipe(oldRecipe, name, ingredients) {
        let newRecipe = new Recipe(name, ingredients);
        let isUnique = true;
        let recipes = this.state.recipes.map(value => {
            if (value.equals(oldRecipe)) return new Recipe(name, ingredients);
            if (value.equals(newRecipe)) isUnique = false;
            return value;
        });
        if (isUnique) {
            this.saveRecipes(recipes);
        }
        else {
            alert('Cannot edit recipe, "' + name + '" already exists.');
        }
    }

    render() {
        return (
            <div className="container">
                <h1>Recipe Box - React App</h1>
                <RecipesList recipes={this.state.recipes} addRecipe={this.addRecipe} removeRecipe={this.removeRecipe} editRecipe={this.editRecipe} />
                <RecipeButton text="Add Recipe" addRecipe={this.addRecipe} />
            </div>
        );
    }
}

class RecipesList extends React.Component {
    render() {
        let recipes = this.props.recipes.map((recipe, index) => {
            return <RecipeItem key={index} recipe={recipe} addRecipe={this.props.addRecipe} removeRecipe={this.props.removeRecipe} editRecipe={this.props.editRecipe} />
        });
        return <ul className="list-group list-unstyled">{recipes}</ul>;
    }
}

class RecipeItem extends React.Component {

    constructor(props) {
        super(props);
        this.handleRemove = this.handleRemove.bind(this);
    }

    handleRemove() {
        this.props.removeRecipe(this.props.recipe);
    }

    render() {
        return (
            <li>
                <a className="list-group-item" role="button" data-toggle="collapse" href={"#" + id(this.props.recipe.name)} aria-expanded="false" aria-controls={id(this.props.recipe.name)}>
                    {this.props.recipe.name}
                </a>
                <div className="collapse" id={id(this.props.recipe.name)}>
                    <div className="alert alert-info">
                        <p>{this.props.recipe.toString()}</p>
                        <RecipeButton text="Edit" recipe={this.props.recipe.name} ingredients={this.props.recipe.toString()} addRecipe={this.props.addRecipe} removeRecipe={this.props.removeRecipe} editRecipe={this.props.editRecipe} />
                        <button className="btn btn-danger" onClick={this.handleRemove}>Remove</button>
                    </div>
                </div>
            </li>
        );
    }
}

class RecipeButton extends React.Component {

    constructor(props) {
        super(props);
        this.handleAdd = this.handleAdd.bind(this);
    }

    handleAdd() {
        let recipe = this.refs.recipe.value;
        let ingredients = this.refs.ingredients.value.split(',');
        if (recipe) {
            if (this.props.text === 'Edit') {
                this.props.editRecipe(new Recipe(this.props.recipe), recipe, ingredients);
            }
            else {
                this.props.addRecipe(recipe, ingredients);
            }
            $("#myModal" + id(this.props.recipe)).modal("toggle");
        }
    }

    render() {
        let btnClass = "btn btn-" + (this.props.text === 'Edit' ? 'success edit-button' : 'primary');
        return (
            <div>
                <button type="button" className={btnClass} data-toggle="modal" data-target={"#myModal" + id(this.props.recipe)}>
                    {this.props.text}
                </button>
                <div className="modal fade" id={"myModal" + id(this.props.recipe)} tabIndex={-1} role="dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">× </span></button>
                                <h4 className="modal-title">{this.props.text}</h4>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="form-group">
                                        <label htmlFor={id(this.props.recipe) + '-name'} className="control-label">Recipe name: </label>
                                        <input type="text" className="form-control" id={id(this.props.recipe) + '-name'} ref="recipe" defaultValue={this.props.recipe} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={id(this.props.recipe) + '-ingredients'} className="control-label">Ingredients: </label>
                                        <textarea className="form-control" id={id(this.props.recipe) + '-ingredients'} ref="ingredients" defaultValue={this.props.ingredients} />
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                                <button type="button" className="btn btn-primary" onClick={this.handleAdd}>Save changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

RecipeButton.defaultProps = {
    recipe: "",
    ingredients: "ingredient1, ingredient2",
};

ReactDOM.render(<RecipesApp />, document.getElementById("root"));
