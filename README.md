# m-prop-models

Implements a model that can be passed as a prop to subcomponents in vue or react. The subcomponents, can define the members of the model dynamically and can update the fields it defines, without having those warnings about props are readonly. Changes in members are turned into events that are captured by the root components of the model and updated there.  
