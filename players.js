// Fame goes from 1 (nobody knows him) to 100 (superstar).
// Placeholder numbers for now. The real database replaces them in Step 7.

const prompts = [
  {
    question: "Name a Red Sox pitcher",
    players: [
      { name: "Pedro Martinez", fame: 98 },
      { name: "Roger Clemens", fame: 95 },
      { name: "Jon Lester", fame: 80 },
      { name: "Josh Beckett", fame: 75 },
      { name: "Tim Wakefield", fame: 70 },
      { name: "Clay Buchholz", fame: 55 },
      { name: "Daniel Bard", fame: 40 },
      { name: "Hideki Okajima", fame: 35 },
      { name: "Manny Delcarmen", fame: 15 }
    ]
  },
  {
    question: "Name a Yankees shortstop",
    players: [
      { name: "Derek Jeter", fame: 100 },
      { name: "Phil Rizzuto", fame: 75 },
      { name: "Bucky Dent", fame: 60 },
      { name: "Gleyber Torres", fame: 55 },
      { name: "Didi Gregorius", fame: 50 },
      { name: "Anthony Volpe", fame: 50 },
      { name: "Eduardo Nunez", fame: 30 },
      { name: "Tony Fernandez", fame: 30 },
      { name: "Ramiro Pena", fame: 15 }
    ]
  },
  {
    question: "Name a Braves outfielder",
    players: [
      { name: "Hank Aaron", fame: 99 },
      { name: "Ronald Acuna Jr", fame: 90 },
      { name: "Andruw Jones", fame: 80 },
      { name: "Dale Murphy", fame: 75 },
      { name: "Jason Heyward", fame: 60 },
      { name: "Jeff Francoeur", fame: 50 },
      { name: "Melky Cabrera", fame: 40 },
      { name: "Ender Inciarte", fame: 35 },
      { name: "Nate McLouth", fame: 30 },
      { name: "Jordan Schafer", fame: 15 }
    ]
  },
  {
    question: "Name a Cardinals catcher",
    players: [
      { name: "Yadier Molina", fame: 95 },
      { name: "Willson Contreras", fame: 70 },
      { name: "Ted Simmons", fame: 55 },
      { name: "Mike Matheny", fame: 50 },
      { name: "Tim McCarver", fame: 50 },
      { name: "Tony Cruz", fame: 15 },
      { name: "Andrew Knizner", fame: 15 }
    ]
  },
  {
    question: "Name a Cubs first baseman",
    players: [
      { name: "Anthony Rizzo", fame: 90 },
      { name: "Ernie Banks", fame: 85 },
      { name: "Derrek Lee", fame: 70 },
      { name: "Mark Grace", fame: 70 },
      { name: "Carlos Pena", fame: 45 },
      { name: "Hee-Seop Choi", fame: 20 },
      { name: "Bryan LaHair", fame: 15 }
    ]
  },
  {
    question: "Name a Dodgers closer",
    players: [
      { name: "Kenley Jansen", fame: 85 },
      { name: "Eric Gagne", fame: 75 },
      { name: "Craig Kimbrel", fame: 50 },
      { name: "Jonathan Broxton", fame: 45 },
      { name: "Takashi Saito", fame: 35 },
      { name: "Todd Worrell", fame: 30 },
      { name: "Brandon League", fame: 25 },
      { name: "Jeff Shaw", fame: 20 }
    ]
  },
  {
    question: "Name a Mets third baseman",
    players: [
      { name: "David Wright", fame: 90 },
      { name: "Robin Ventura", fame: 50 },
      { name: "Howard Johnson", fame: 45 },
      { name: "Edgardo Alfonzo", fame: 45 },
      { name: "Wilmer Flores", fame: 35 },
      { name: "Juan Uribe", fame: 30 },
      { name: "Eduardo Escobar", fame: 30 },
      { name: "Ty Wigginton", fame: 25 },
      { name: "Hubie Brooks", fame: 25 }
    ]
  }
];